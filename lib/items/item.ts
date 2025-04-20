'use server'
import { ID, Query } from "node-appwrite";
import { database, storage } from "../appwrite.config";
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

      const now = new Date();
  
      // Map the response to include only necessary fields
      const itemsWithNames = await Promise.all(
        response.documents.map(async (doc) => {
          const createdAt = new Date(doc.$createdAt);
          const diffInMinutes = (now.getTime() - createdAt.getTime()) / 60000;
  
          // If more than 10 minutes old and not already "late", update the status
          if (diffInMinutes > 10 && doc.status !== "late") {
            try {
              ApproveBookingRequest(doc.$id, "late")
              doc.status = "late"; // Update local value too
            } catch (updateError) {
              console.error(`Failed to update status for ${doc.$id}:`, updateError);
            }
          }
  
          return {
            $id: doc.$id,
            itemId: doc.itemId,
            itemName: doc.itemName,
            start: doc.start,
            end: doc.end,
            bookedQuantity: doc.bookedQuantity,
            status: doc.status,
          };
        })
      );
  
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

      if (statusTo === "late"){
        const response = await database.getDocument(
          DATABASE_ID!,
          BOOKINGS_COLLECTION_ID!,
          requestId
        )

        const item = await database.getDocument(
          DATABASE_ID!,
          ITEMS_COLLECTION_ID!,
          response.itemId
        )

        const availableQuantity = item.availableQuantity;

        const bookedQuanitity = response.bookedQuantity;

        await database.updateDocument(
          process.env.DATABASE_ID!,
          ITEMS_COLLECTION_ID!,
          response.itemId,
          {
            availableQuantity: availableQuantity + bookedQuanitity,
          }
        )
      }
  
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
            receivedAt: doc.receivedAt,
            returnedAt: doc.returnedAt,
            requestedBy: doc.requestedBy
          };
        })
      );
      
      return itemsWithNames;
    } catch (error) {
      console.error("Failed to read booking items:", error);
      throw new Error("Failed to read booking items");
    }
  }
// Reading Items of Society
  export async function ReadItemsInSociety() {
    // VERIFYING USER
    const user = await getUser();
  
    if (!user) {
      return redirect("/");
    }
    const userId = await getUserId(user.email!);
  
    try {
      // Fetch booking items from Appwrite
      const response = await database.listDocuments(
        process.env.DATABASE_ID!,
        process.env.ITEMS_COLLECTION_ID!,
        [Query.equal("society", [userId])]
      );
  
      // Initialize an array to store the items with itemName
      const itemsWithDetails = [];
  
      // Iterate over the fetched documents to construct the items array
      for (const doc of response.documents) {
        // Construct the inventory item with the required fields
        const inventoryItem = {
          $id: doc.$id,
          itemName: doc.itemName, // Adding itemName here
          totalQuantity: doc.totalQuantity, // Assuming these fields exist in the document
          availableQuantity: doc.availableQuantity,
          issuedQuantity: doc.totalQuantity-doc.availableQuantity - doc.damagedQuantity, // Assuming these fields exist in the document
        };
  
        // Add the inventory item to the array
        itemsWithDetails.push(inventoryItem);
      }
  
      return itemsWithDetails; // Return the array of inventory items
  
    } catch (error) {
      console.error("Error fetching items:", error);
      throw new Error("Failed to fetch items"); // Handle the error appropriately
    }
  }


  function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
  
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  // GETTING BOOKING ITEMS BY "requestedTo" ID
export async function ReadBookingItemsByRequestedTo() {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    return redirect("/");
  }
  const userId = await getUserId(user.email!);

  try {

    // fetch user from Appwrite
    const fetchedUser = await database.getDocument(
      process.env.DATABASE_ID!,
      process.env.USERS_COLLECTION_ID!,
      userId
    )
    // Fetch booking items from Appwrite
    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      process.env.BOOKINGS_COLLECTION_ID!,
      [Query.equal("requestedTo", [fetchedUser.id])]
    );


    // Initialize an array to store the items with itemName
    const itemsWithNames = [];

    // Iterate over the fetched booking items
    for (const doc of response.documents) {
      // Fetch the corresponding inventory item to get the itemName
      const inventoryItem = await ReadItemById(doc.itemId);
      const start = formatDateTime(doc.start);
      const end = formatDateTime(doc.end);

      // Construct the booking item with the itemName included
      const bookingItem = {
        $id: doc.$id,
        itemId: doc.itemId,
        itemName: inventoryItem.itemName, // Adding itemName here
        start: start,
        end: end,
        purpose: doc.purpose,
        bookedQuantity: doc.bookedQuantity,
        requestedBy: doc.requestedBy,
        status: doc.status,
      };

      // Add the booking item to the array
      itemsWithNames.push(bookingItem);
    }

    return itemsWithNames;
  } catch (error) {
    console.error("Failed to read booking items:", error);
    throw new Error("Failed to read booking items");
  }
}


//check coorect Society

export async function checkSocietyCorrect(requestId: string){
  const user = await getUser();

  if (!user) {
    return false; // Or handle the unauthorized case as needed
  }

  try{
    const userId = await getUserId(user.email!);
    const us = await ReadUserById(userId);
    const society_extracted = us.$id;
    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      BOOKINGS_COLLECTION_ID!, 
      [Query.equal("$id", [requestId])]
    );
    if (society_extracted === response.documents[0].requestedTo)
      return true;
    else
    return false;
  }catch (error) {
    console.error("Failed to check role:", error);
    throw new Error("Failed to check role");
  }

}


// ADDING NEW INVENTORY ITEM
export async function CreateInventoryItem(formdata: FormData) {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    redirect("/");
    return;
  }

  // EXTRACTING FORM DATA
  const itemName = formdata.get("name") as string;
  const itemImage = formdata.get("itemImage") as File; // Corrected key
  const totalQuantity = parseInt(formdata.get("total-quantity") as string, 10);
  const availableQuantity = parseInt(formdata.get("available-quantity") as string, 10);
  const description = formdata.get("description") as string;
  const society = formdata.get("society") as string;
  const council = formdata.get("council") as string;
  const defaultStatus = formdata.get("defaultStatus") as string;
  const maxQuantity = parseInt(formdata.get("allowed-quantity") as string, 10);
  const maxTime = parseInt(formdata.get("allowed-time") as string, 10);

  let imageUrl = '';

  // Handle file upload to Appwrite Storage
  if (itemImage && itemImage.size > 0) {
    try {
      const response = await storage.createFile(
        process.env.BUCKET_ID!,    // Your Appwrite bucket ID
        'unique()',                // Unique file ID
        itemImage                  // The file to be uploaded
      );

      // After uploading, construct the URL to access the file
      imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${response.$id}/view?project=${process.env.PROJECT_ID}`;
      
      console.log("Image uploaded successfully:", imageUrl);
      
    } catch (error) {
      console.error("Error uploading file to Appwrite storage:", error);
      throw new Error("Failed to upload image to Appwrite storage");
    }
  } else {
    imageUrl = 'https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg';
    console.warn("No image file provided or file is empty.");
  }
  

  // Create a new document in Appwrite database
  try {
    await database.createDocument(
      process.env.DATABASE_ID!,              // Your Appwrite database ID
      process.env.ITEMS_COLLECTION_ID!,      // Your collection ID
      'unique()',                            // Unique document ID
      {
        itemName,
        description,
        totalQuantity,
        availableQuantity,
        society,
        council,
        defaultStatus,
        itemImage: imageUrl,// Store the image URL in the database
        maxQuantity,
        maxTime,                  
        addedBy: user.email                 // Use the correct user ID property
      }
    );

    console.log("Inventory item created successfully.");
    revalidatePath('/add-item');
  } catch (error) {
    console.error("Failed to create inventory item:", error);
    throw new Error("Failed to create inventory item");
  }

  redirect("/inventory");
}


//Deleting Inventory Item

export async function DeleteInventoryItem(
  itemId: string,
) {
  const user = await getUser();

  if (!user) {
    return redirect("/");
  }

  try {
    // Deleting the document from the Appwrite database
    await database.deleteDocument(
      process.env.DATABASE_ID!,
      process.env.ITEMS_COLLECTION_ID!,
      itemId
    );

    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      process.env.BOOKINGS_COLLECTION_ID!,
      [Query.equal("itemId", [itemId])]
    );

    for (const doc of response.documents){
      await database.deleteDocument(
        process.env.DATABASE_ID!,
        process.env.BOOKINGS_COLLECTION_ID!,
        doc.$id
        );
    }

    revalidatePath(`/inventory-admin`);
  } catch (error) {
    console.error("Failed to delete booking request:", error);
    throw new Error("Failed to delete booking request");
  }
}


//Upadting Item 

export async function UpdateInventoryItem(itemId: string, total: number, available: number, damaged: number){
  try{
    await database.updateDocument(
      process.env.DATABASE_ID!,
      process.env.ITEMS_COLLECTION_ID!, // Ensure this is set to your items collection ID
      itemId, // Use itemId to identify the document
      {
        availableQuantity: available,
        totalQuantity: total,
        damagedQuantity: damaged
      }
    );
  }
  catch (error) {
    console.error("Failed to update inventory:", error);
    throw new Error("Failed to update inventory");
  }
}

// update image bucket
export async function UpdateImage(fileId: string, formdata: FormData){
  const imageFile = formdata.get("itemImage") as File;
  if (imageFile && imageFile.size > 0) {
    if (fileId!=="https:")
  try {
    await storage.deleteFile(
      process.env.BUCKET_ID!,    // Your Appwrite bucket ID
      fileId
    );
  } catch (error) {
    console.error("Error deleting old file to Appwrite storage:", error);
    throw new Error("Failed to deleting old image to Appwrite storage");
  }

  try {
    const response = await storage.createFile(
      process.env.BUCKET_ID!,    // Your Appwrite bucket ID
      'unique()',                // Unique file ID
      imageFile                  // The file to be uploaded
    );

    // After uploading, construct the URL to access the file
    const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${response.$id}/view?project=${process.env.PROJECT_ID}`;
    
    return imageUrl;


    
  } catch (error) {
    console.error("Error updating file to Appwrite storage:", error);
    throw new Error("Failed to updating image to Appwrite storage");
  }
}


}

//Modify Inventory Item
export async function ModifyInventoryItem(itemId: string, formdata: FormData) {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    redirect("/");
    return;
  }

  // EXTRACTING FORM DATA
  const itemName = formdata.get("itemName") as string;
  const itemImage = formdata.get("itemImage") as string; // Corrected key
  const totalQuantity = parseInt(formdata.get("total-quantity") as string, 10);
  const availableQuantity = parseInt(formdata.get("available-quantity") as string, 10);
  const description = formdata.get("description") as string;
  const society = formdata.get("society") as string;
  const council = formdata.get("council") as string;
  const defaultStatus = formdata.get("defaultStatus") as string;
  const maxQuantity = parseInt(formdata.get("allowed-quantity") as string,10);
  const maxTime = parseInt(formdata.get("allowed-time") as string, 10);
  console.log(itemName);

  try{
    await database.updateDocument(
      process.env.DATABASE_ID!,              // Your Appwrite database ID
      process.env.ITEMS_COLLECTION_ID!,
      itemId,
      {
        itemName: itemName,
        itemImage: itemImage,
        description: description,
        totalQuantity: totalQuantity,
        availableQuantity: availableQuantity,
        maxQuantity: maxQuantity,
        maxTime: maxTime,
        society: society,
        council: council,
        defaultStatus: defaultStatus
      }
    )
  }catch(error){
    console.error("Failed to modify inventory", error);
    throw new Error("Failed to modify inventory");
  }
}

