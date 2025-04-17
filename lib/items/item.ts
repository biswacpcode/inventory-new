'use server'
import { ID, Query } from "node-appwrite";
import { database } from "../appwrite.config";
import { getUser, getUserId, ReadUserById } from "../action";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendBookingConfirmationEmail } from "../mailing/mail";
import { formatISTDateTime } from "../utils";
const {
    DATABASE_ID, ITEMS_COLLECTION_ID, BOOKINGS_COLLECTION_ID
} = process.env;

// Reading all Inventory Items for the /inventory Page
export async function ReadInventoryItems() {
    // Verify user authentication
    const user = await getUser();
    if (!user) return null;
  
    try {
      const { documents } = await database.listDocuments(
        DATABASE_ID!,
        ITEMS_COLLECTION_ID!,
      );
  
      const items = documents.map((doc) => {
        const {
          $id,
          itemName,
          itemImage,
          totalQuantity = 0,
          availableQuantity = 0,
          damagedQuantity = 0,
          description,
          society,
          council,
          addedBy
        } = doc;
  
        return {
          $id,
          itemName,
          itemImage,
          totalQuantity,
          availableQuantity,
          damagedQuantity,
          description,
          society,
          council,
          addedBy,
          issuedQuantity: totalQuantity - availableQuantity - damagedQuantity
        };
      });
  
      console.log(`Fetched ${items.length} inventory items`);
      return items;
  
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      throw new Error("Unable to fetch inventory items");
    }
  }
  
  // Reading Item as per Search Term
  export async function ReadItemByName( searchTerm: string) {
    // Verify user authentication
    const user = await getUser();
    if (!user) return null;
  
  
    try {
      const { documents } = await database.listDocuments(
        DATABASE_ID!,
        ITEMS_COLLECTION_ID!,
        [
            Query.startsWith("itemName", searchTerm), // Case Sensitive prefix match
          Query.limit(100) // Adjust the limit as needed
        ]
      );
  
      return documents.map(doc => ({
        $id: doc.$id,
        itemName: doc.itemName,
        itemImage: doc.itemImage,
        totalQuantity: doc.totalQuantity,
        availableQuantity: doc.availableQuantity,
        description: doc.description,
        society: doc.society,
        council: doc.council,
        addedBy: doc.addedBy,
        issuedQuantity: doc.totalQuantity - doc.availableQuantity - doc.damagedQuantity,
        damagedQuantity: doc.damagedQuantity
      }));
  
    } catch (error) {
      console.error(`Error searching item by name:`, error);
      throw new Error(`Unable to fetch item(s)`);
    }
  }

  //Reading Item by id
  export async function ReadItemById(itemId: string) {
    try {
      // Fetch a single inventory item by ID
      const response = await database.getDocument(
        DATABASE_ID!,
        ITEMS_COLLECTION_ID!,
        itemId
      );
      // Map the document to the InventoryItem type
      const item = {
        $id: response.$id,
        itemName: response.itemName,
        itemImage: response.itemImage,
        totalQuantity: response.totalQuantity,
        availableQuantity: response.availableQuantity,
        description: response.description,
        society: response.society,
        council: response.council,
        addedBy: response.addedBy,
        damagedQuantity: response.damagedQuantity,
        defaultStatus: response.defaultStatus,
        maxQuantity: response.maxQuantity,
        maxTime: response.maxTime
      };
  
      return item;
    } catch (error) {
      console.error("Failed to read inventory item:", error);
      throw new Error("Failed to read inventory item");
    }
  }

  // Item Booking Request

  export async function CreateBookingRequest(formdata: FormData) {
    // VERIFYING USER
    const user = await getUser();
  
    if (!user) {
      return redirect("/");
    }
  
    // EXTRACTING FORM DATA
    const itemId = formdata.get("itemId") as string;
    const item = await ReadItemById(itemId);
    const itemName = item.itemName;
    const start = formdata.get("start") as string;
    const end = formdata.get("end") as string;
    const bookedQuantity = parseInt(formdata.get("bookedQuantity") as string, 10);
    const requestedTo = formdata.get("requestedTo") as string;
    const status = formdata.get("status") as string;

    
    const id = ID.unique();
  
    try {
      // Create a new booking request in Appwrite
      await database.createDocument(
        DATABASE_ID!,
        BOOKINGS_COLLECTION_ID!, // Ensure these are set in your .env.local
        id, // Generates a unique document ID
        {
          itemId,
          start,
          end,
          bookedQuantity,
          requestedUser: await getUserId(user.email!), // Associate booking with the current user
          requestedTo,
          status: status || "pending" , // Set the initial status
          itemName
        }
      );
      const newAvailableQuantity = item.availableQuantity - bookedQuantity;
  
      // Update the item to reduce available quantity
      await database.updateDocument(
        DATABASE_ID!,
        ITEMS_COLLECTION_ID!, 
        itemId, // Use itemId to identify the document
        {
          availableQuantity: newAvailableQuantity,
        }
      );
  
      revalidatePath(`/inventory/${itemId}`);

      await sendBookingConfirmationEmail(user.email!, {
        itemName,
        start,
        end,
        bookedQuantity,
      });
    } catch (error) {
      console.error("Failed to create booking request:", error);
      throw new Error("Failed to create booking request");
    }return id;
    
  }


  //Read Booking Requests of items for the current user

  export async function ReadItemBookingsByRequestedBy() {
    // VERIFYING USER
    const user = await getUser();
  
    if (!user) {
      return redirect("/");
    }
  
    try {
      // Fetch booking items from Appwrite with limit and descending order
      const response = await database.listDocuments(
        DATABASE_ID!,
        BOOKINGS_COLLECTION_ID!,
        [
          Query.equal("requestedUser", [user.id]),
          Query.orderDesc("$createdAt"), 
          Query.limit(100),
        ]
      );
  
      // Map the response to include only necessary fields
      const itemsWithNames = response.documents.map((doc) => ({
        $id: doc.$id,
        itemId: doc.itemId,
        itemName: doc.itemName,
        start: doc.start,
        end: doc.end,
        bookedQuantity: doc.bookedQuantity,
        status: doc.status,
      }));
  
      return itemsWithNames;
    } catch (error) {
      console.error("Failed to read booking items:", error);
      throw new Error("Failed to read booking items");
    }
  }


  //Deleting Booking Request
  export async function DeleteBookingRequest(
    requestId: string,
    itemId: string,
    bookedQuantity: number
  ) {
    const user = await getUser();
  
    if (!user) {
      return redirect("/");
    }
    try {
      // Deleting the document from the Appwrite database
      await database.deleteDocument(
        DATABASE_ID!,
        BOOKINGS_COLLECTION_ID!,
        requestId
      );
      const item = await ReadItemById(itemId);
      const newAvailableQuantity = item.availableQuantity + bookedQuantity;
  
      // Update the item to reduce available quantity
      await database.updateDocument(
        DATABASE_ID!,
        ITEMS_COLLECTION_ID!, 
        itemId, // Use itemId to identify the document
        {
          availableQuantity: newAvailableQuantity,
        }
      );
  
      revalidatePath(`/requests`);
    } catch (error) {
      console.error("Failed to delete booking request:", error);
      throw new Error("Failed to delete booking request");
    }
  }
  

  //Reading booked requets by id 

  export async function ReadBookedItembyId(requestId: string) {
    try {
      const response = await database.getDocument(
        process.env.DATABASE_ID!,
        process.env.BOOKINGS_COLLECTION_ID!, 
        requestId
      );
  
      if (!response) {
        throw new Error("No items found");
      }
  
      const doc = response;
      const bookedQuanitity: number = doc.bookedQuantity;
      const status: string = doc.status;
  
      return {
        itemId: doc.itemId,
        itemName: doc.itemName,
        bookedQuantity: bookedQuanitity,
        status: status,
        requestedAt: doc.$createdAt,
        requestedBy: doc.requestedUser
      };
    } catch (error) {
      console.error("Failed to read booking items:", error);
      throw new Error("Failed to read booking items");
    }
  }


  // Approving and Status Update of Booked Items

  export async function ApproveBookingRequest(
    requestId: string,
    statusTo: string
  ) {

    const user = await getUser();
    if ((!user))
      return ;
    try {
      // Update the status of the booking request to "approved"
      await database.updateDocument(
        process.env.DATABASE_ID!,
        process.env.BOOKINGS_COLLECTION_ID!,
        requestId,
        {
          status: statusTo,
        }
      );
  
      revalidatePath(`/items-requests`);
    } catch (error) {
      console.error("Failed to approve booking request:", error);
      throw new Error("Failed to approve booking request");
    }
  }

  //Updataing damaged quantitiy
export async function DamagedQuantityUpdate(
  itemId: string,
  bookedQuantity: number
) {
  const user = await getUser();

  if (!user) {
    return redirect("/");
  }

  try{
    const response = await database.getDocument(
      process.env.DATABASE_ID!,
      process.env.ITEMS_COLLECTION_ID!, // Ensure this is set to your items collection ID
      itemId
    )
    const damagedQuantity = response.damagedQuantity;
    await database.updateDocument(
      process.env.DATABASE_ID!,
      process.env.ITEMS_COLLECTION_ID!, // Ensure this is set to your items collection ID
      itemId, // Use itemId to identify the document
      {
        damagedQuantity: damagedQuantity + bookedQuantity
      }
    );
  }
  catch (error) {
    console.error("Failed to update the damaged quantity:", error);
    throw new Error("Failed to damaged quantity");
  }
}
  

//Recieved Item from Manager - Time Update
export async function receivetimeUpdate(requestId: string, currentTime: string){
  try{
    await database.updateDocument(
      process.env.DATABASE_ID!,
      process.env.BOOKINGS_COLLECTION_ID!,
      requestId,
      {
        receivedAt: currentTime
      }
    );
  }
  catch (error) {
    console.error("Failed to update received time:", error);
    throw new Error("Failed to update received time:");
}
}


//Returned to the Manager - Time Update
export async function returntimeUpdate(requestId: string, itemId: string, currentTime: string, bookedQuanitity: number){
  try{
    
    await database.updateDocument(
      process.env.DATABASE_ID!,
      process.env.BOOKINGS_COLLECTION_ID!,
      requestId,
      {
        returnedAt: currentTime
      }
    );

    const response = await database.getDocument(
      process.env.DATABASE_ID!,
      process.env.ITEMS_COLLECTION_ID!,
      itemId
    );
    const availableQuantity = response.availableQuantity;
    const newAvailableQuantity = availableQuantity+bookedQuanitity;
    await database.updateDocument(
      process.env.DATABASE_ID!,
      process.env.ITEMS_COLLECTION_ID!,
      itemId,
      {
        availableQuantity: newAvailableQuantity
        }
        );
  }
  catch (error) {
    console.error("Failed to update returned time:", error);
    throw new Error("Failed to update returned time:");
}
}


  //Read Booking Requests of items for the manager list

  export async function ReadItemBookings() {
    // VERIFYING USER
    const user = await getUser();
  
    if (!user) {
      return redirect("/");
    }
  
    try {
      // Fetch booking items from Appwrite with limit and descending order
      const response = await database.listDocuments(
        DATABASE_ID!,
        BOOKINGS_COLLECTION_ID!,
        [
          Query.orderDesc("$createdAt"), 
          Query.limit(100),
        ]
      );
  
      // Map the response to include only necessary fields
      const itemsWithNames = await Promise.all(
        response.documents.map(async (doc) => {
          const user = await ReadUserById(doc.requestedUser);
          return {
            $id: doc.$id,
            itemId: doc.itemId,
            itemName: doc.itemName,
            start: doc.start,
            end: doc.end,
            bookedQuantity: doc.bookedQuantity,
            status: doc.status,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
          };
        })
      );
      
      return itemsWithNames;
    } catch (error) {
      console.error("Failed to read booking items:", error);
      throw new Error("Failed to read booking items");
    }
  }

