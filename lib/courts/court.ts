'use server'
import { ID, Models, Query } from "node-appwrite";
import { database, storage } from "../appwrite.config";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { getUser, getUserId } from "../action";
import { redirect } from "next/navigation";
import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";
const {
    DATABASE_ID, COURTS_COLLECTION_ID,COURTBOOKINGS_COLLECTION_ID
} = process.env;

//Reading all the courts for the /inventory page
export async function ReadInventoryCourts() {
    // VERIFYING USER
    const user = await getUser();
  
    if (!user) {
      return null; // Or handle the unauthorized case as needed
    }
  
    try {
      // Fetch inventory items from Appwrite
      const response = await database.listDocuments(
        DATABASE_ID!,
        COURTS_COLLECTION_ID!
      );
  
      // Map the documents to the InventoryItem type
      const items = response.documents.map((doc) => ({
        $id: doc.$id,
        courtName: doc.courtName,
        courtImage: doc.courtImage,
        location: doc.location
      }));
  
      return items;
    } catch (error) {
      console.error("Failed to read inventory items:", error);
      throw new Error("Failed to read inventory items");
    }
  }


  
  // Reading Item as per Search Term
  export async function ReadCourtByName( searchTerm: string) {
    // Verify user authentication
    const user = await getUser();
    if (!user) return null;
  
  
    try {
      const { documents } = await database.listDocuments(
        DATABASE_ID!,
        COURTS_COLLECTION_ID!,
        [
            Query.startsWith("courtName", searchTerm), // Case Sensitive prefix match
          Query.limit(100) // Adjust the limit as needed
        ]
      );
  
      return documents.map(doc => ({
        $id: doc.$id,
        courtName: doc.courtName,
        courtImage: doc.courtImage,
        location: doc.location
      }));
  
    } catch (error) {
      console.error(`Error searching item by name:`, error);
      throw new Error(`Unable to fetch item(s)`);
    }
  }



  // Read Court by court id

export async function ReadCourtById(courtId: string): Promise<Models.Document | null> {
  try {
    const court = await database.getDocument(
      process.env.DATABASE_ID!,
      process.env.COURTS_COLLECTION_ID!,
      courtId
    );

    if (court) {
      return court;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching court by ID:", error);
    throw new Error("Failed to fetch court details.");
  }
}

//ReadCourtBookingsByCourtIdAndDate

export async function ReadCourtBookingsByCourtIdAndDate(
  courtId: string,
  date: string
): Promise<Models.Document[]> {
  try {
    const startOfDay = `${date}T00:00:00`
const endOfDay = `${date}T23:59:59`

const bookings = await database.listDocuments(
  process.env.DATABASE_ID!,
  process.env.COURTBOOKINGS_COLLECTION_ID!,
  [
    Query.equal("courtId", [courtId]),
    Query.greaterThanEqual("start", startOfDay),
  ]
);



    return bookings.documents;
  } catch (error) {
    console.error("Error fetching court bookings:", error);
    throw new Error("Failed to fetch court bookings.");
  }
}

// Reading Court by Court Type and Date
export async function ReadCourtBookingsByCourtTypeAndDate(
  courtType: string,
  date: string
): Promise<Models.Document[]> {
  try {
    const startOfDay = new Date(`${date}T00:00:00`).toISOString();
const endOfDay = new Date(`${date}T23:59:59`).toISOString();

const bookings = await database.listDocuments(
  process.env.DATABASE_ID!,
  process.env.COURTBOOKINGS_COLLECTION_ID!,
  [
    Query.equal("type", [courtType]),
    Query.greaterThanEqual("start", startOfDay),
    Query.lessThanEqual("start", endOfDay),
  ]
);



    return bookings.documents;
  } catch (error) {
    console.error("Error fetching court bookings:", error);
    throw new Error("Failed to fetch court bookings.");
  }
}



//Creating the Court Booking Request

export async function CreateCourtRequest(data: {
  courtId: string;
  courtName: string;
  requestedUser: string;
  companions: string[];
  date: string; // YYYY-MM-DD
  timeSlot: string;
   // e.g., "05:00-06:00"
   type:string;
}): Promise<string> {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    return redirect("/");

  }
  const userId = await getUserId(user.email!);

  const { courtId, courtName, requestedUser, companions, date, timeSlot, type } = data;

  // Parse timeSlot
  const [startTime, endTime] = timeSlot.split("-");
  if (!startTime || !endTime) {
    throw new Error("Invalid time slot format.");
  }

  // Combine date and time into ISO strings
  const start = new Date(`${date}T${startTime.trim()}`).toISOString();
  const end = new Date(`${date}T${endTime.trim()}`).toISOString();
  

  const bookingId = ID.unique();
  console.log(companions);

  try {
    // Create a new court booking request in Appwrite
    await database.createDocument(
      process.env.DATABASE_ID!,
      process.env.COURTBOOKINGS_COLLECTION_ID!,
      bookingId,
      {
        courtId,
        courtName,
        start,
        end,
        status: "reserved", // Initial status
        requestedUser : userId,
        companions: companions.join(","),
        type
      }
    );

    console.log("Court booking request created successfully.");
  } catch (error) {
    console.error("Failed to create court booking request:", error);
    throw new Error("Failed to create court booking request.");
  }

  return bookingId;
}
//Parsse Time
function parseTime(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}


// generate the time slots

export async function GenerateAvailableTimeSlots(
  courtId: string,
  date: string
): Promise<string[]> {
  const court: Models.Document | null = await ReadCourtById(courtId);

  if (!court) {
    throw new Error("Court not found.");
  }

  // Get day of the week
  const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

  const courtTimeSlots: string[] = JSON.parse(court.timeSlots)[dayOfWeek];
  if (!courtTimeSlots || courtTimeSlots.length === 0) {
    return [];
  }

  console.log(courtTimeSlots);
  // Generate all possible 30-minute interval time slots based on court's time slots
  let potentialSlots: string[] = [];

  courtTimeSlots.forEach((slot) => {
    const [start, end] = slot.split("-");
    const startDate = parseTime(start);
    const endDate = parseTime(end);

    let current = startDate;
    const maxDuration = court.maxTime * 60; // in minutes

    while (addMinutes(current, maxDuration) <= endDate) {
      const timeOnlyStart = current.toLocaleTimeString("en-US", { hour12: false });
      const timeOnlyEnd = addMinutes(current, maxDuration).toLocaleTimeString("en-US", { hour12: false });
      potentialSlots.push(`${timeOnlyStart} - ${timeOnlyEnd}`);
      current = addMinutes(current, maxDuration);
    }
  });

  // Fetch existing bookings for the court on the given date
  const existingBookings = await ReadCourtBookingsByCourtIdAndDate(courtId, date);

  // Get the current IST time
  const now = new Date();
  const currentISTTime = new Date(now.getTime() + (330 * 60 * 1000)); // IST is UTC+5:30

  // Count overlaps for each potential slot and filter out past slots
  const availableSlots: string[] = [];
  console.log("Details Here: ", {
    date,
    courtId,
    availableSlots,
    potentialSlots,
    existingBookings,
    currentISTTime: currentISTTime.toISOString(),
  });

  potentialSlots.forEach((potentialSlot) => {
    const [potentialStart, potentialEnd] = potentialSlot.split("-");
    const potentialStartDate = `${date}T${potentialStart.trim()}.000+00:00`;
    console.log({potentialStartDate})
    //const potentialEndDate = new Date(`${date}T${potentialEnd}:00:00.000+00:00`)

    

    // Skip slots that are before the current IST time
    // if (potentialStartDate < currentISTTime) {
    //   return;
    // }


    let overlapCount = 0;

    existingBookings.forEach((booking) => {
      // const bookingStart = new Date(booking.start).getTime();
      // const bookingEnd = new Date(booking.end).getTime();
      
      if(booking.start === potentialStartDate)
        overlapCount+=1;
    });

    if(overlapCount === 0)
      availableSlots.push(potentialSlot);

    
  });

  console.log("Details Here: ", {
    date,
    courtId,
    availableSlots,
    currentISTTime: currentISTTime.toISOString(),
  });

  return availableSlots;
}


//Reading Court Requests as per Request id 

export async function ReadCourtRequest(requestId: string){
  const response = await database.getDocument(
    DATABASE_ID!,
    COURTBOOKINGS_COLLECTION_ID!,
    requestId
  );
  const request = {
    $id:response.$id,
    courtName: response.courtName,
    start: response.start,
    end: response.end,
    companions:response.companions,
    status: response.status,
    requestedUser: response.requestedUser,
    createdAt: response.$createdAt
  }
  return request;
}

//Updating COurt requests

export async function updateCourtRequestStatus(requestId: string, newStatus?:string) {
  try {
    const response = await database.getDocument(
      DATABASE_ID!,
      COURTBOOKINGS_COLLECTION_ID!,
      requestId
    );

    const currentTime = new Date().toISOString();
    console.log("New Status to updated : ", newStatus)

    const status = newStatus ? newStatus : 
      response.status === "reserved"
        ? "punched-in"
        : response.status === "punched-in"
        ? "punched-out"
        : "late";

    await database.updateDocument(
      DATABASE_ID!,
     COURTBOOKINGS_COLLECTION_ID!,
      requestId,
      {
        status: status
      }
    );

    if (status === "punched-in") {
      await database.updateDocument(
        DATABASE_ID!,
        COURTBOOKINGS_COLLECTION_ID!,
        requestId,
        {
          punchedInTime: currentTime
        }
      );
    } else if (status === "punched-out") {
      await database.updateDocument(
        DATABASE_ID!,
        COURTBOOKINGS_COLLECTION_ID!,
        requestId,
        {
          punchedOutTime: currentTime
        }
      );
    }
  } catch (error) {
    console.error("Failed to update the status of Court Request", error);
    throw new Error("Failed to update the status of Court Request");
  }
}


// Read Court Requests by requested ID
export async function ReadCourtRequestsByRequestedBy() {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }
  const userId = await getUserId(user.email!);
// try {
//   const bookings = await database.listDocuments(
//     DATABASE_ID!,
//     COURTS_COLLECTION_ID!,
//     [
//       Query.equal("status", ["reserved"]),
//     ]
//   );
  
//   const currentISTTime = new Date();
//   currentISTTime.setMinutes(currentISTTime.getMinutes() + 330); // Convert UTC to IST
//   99+9
//   const currentDateIST = currentISTTime.toISOString().split("T-0")[0]; // Get current date in YYYY-MM-DD format
  
//   bookings.documents.forEach(async (booking) => {
//     const bookingStartDate = new Date(booking.start);
//     bookingStartDate.setMinutes(bookingStartDate.getMinutes());
//     const bookingDate = bookingStartDate.toISOString().split("T")[0]; // Extract date in YYYY-MM-DD format
//     const createdAt = new Date(booking.$createdAt);
//     createdAt.setMinutes(createdAt.getMinutes() +330);
//     //console.log({bookingStartDate, bookingDate, createdAt, condition:(currentISTTime.getTime() > createdAt.getTime() + 15 * 60 * 1000)});

  
//     if (
//       bookingDate === currentDateIST && // Check if the booking is for today
//       currentISTTime.getTime() > bookingStartDate.getTime() + 15 * 60 * 1000 // Check if the current time is more than 15 minutes late
//       &&currentISTTime.getTime() > createdAt.getTime() + 10 * 60 * 1000
//     ) {
//       await database.updateDocument(
//         DATABASE_ID!,
//         COURTS_COLLECTION_ID!,
//     booking.$id,
//     {
//       status:"late"
//     }
//       )
//     }
//   });
  
  
// } catch (error) {
//   console.error("Failed to read court booking requests:", error);
//   throw new Error("Failed to read court booking requests");
// }


  try {
    const allBookings = await database.listDocuments(
      DATABASE_ID!,
    COURTBOOKINGS_COLLECTION_ID!,
      [
        Query.equal("status", ["reserved", "punched-in", "late"]),
        Query.limit(400) // This should be inside the same array
      ]
    );
    
    // Filter client-side
    const bookings = allBookings.documents.filter(doc => 
      doc.requestedUser === userId ||doc.companions.split(",").includes(userId)
    );


    const fetchBookings = bookings.map((booking)=>{
      return {
        $id: booking.$id,
        courtId: booking.courtId,
        courtName: booking.courtName,
        startDateTime: booking.start,
        endDateTime: booking.end,
        status: booking.status
      }
    })

    return fetchBookings;
  } catch (error) {
    console.error("Failed to read court booking requests:", error);
    throw new Error("Failed to read court booking requests");
  }
}

//Deleting Court Booking Request

export async function DeleteCourtBookingRequest(
  requestId: string
): Promise<void> {
  try {
    await database.deleteDocument(
      process.env.DATABASE_ID!,
      process.env.COURTBOOKINGS_COLLECTION_ID!,
      requestId
    );

    // Optionally, you can update related court availability or perform other actions here
    console.log("Court booking request deleted successfully.");
  } catch (error) {
    console.error("Failed to delete court booking request:", error);
    throw new Error("Failed to delete court booking request.");
  }
}


//Reading All Court Requests

export async function ReadAllCourtRequests(){
  try{

    const response = await database.listDocuments(
      DATABASE_ID!,
      COURTBOOKINGS_COLLECTION_ID!,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(400)
      ]
    )
    if (response.total === 0)
      return []

    const fetchBookings = response.documents.map((booking)=>{
      return {
        $id: booking.$id,
        courtId: booking.courtId,
        courtName: booking.courtName,
        startDateTime: booking.start,
        endDateTime: booking.end,
        status: booking.status
      }
    }
  )
  return fetchBookings;
  }catch(error){
    console.error("Failed to fetch all Court Requests : ", error);
    throw new Error ("Failed to fetch all Court Requests")
  }
}


// Create Courts
export async function CreateInventoryCourt(formdata: FormData) {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    redirect("/");
    return;
  }

  // EXTRACTING FORM DATA
  const courtName = formdata.get("court-name") as string;
  const courtImage = formdata.get("courtImage") as File;
  const location = formdata.get("court-location") as string;
  const type = formdata.get("type") as string;
  const maxTime = parseInt(formdata.get("max-time") as string, 10);
  const minUsers = parseInt(formdata.get("min-users") as string, 10);
  const timeSlotsRaw = formdata.get("time-slots") as string;

  let courtImageUrl = "";

  // HANDLE IMAGE UPLOAD TO APPWRITE STORAGE
  if (courtImage && courtImage.size > 0) {
    try {
      const response = await storage.createFile(
        process.env.BUCKET_ID!, // Your Appwrite bucket ID
        "unique()",             // Unique file ID
        courtImage              // The file to be uploaded
      );

      // Construct the URL to access the file
      courtImageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${response.$id}/view?project=${process.env.PROJECT_ID}`;

      console.log("Court image uploaded successfully:", courtImageUrl);
    } catch (error) {
      console.error("Error uploading court image to Appwrite storage:", error);
      throw new Error("Failed to upload court image");
    }
  } else {
    courtImageUrl = "https://img.freepik.com/free-vector/illustration-gallery-icon_53876-27002.jpg";
    console.warn("No court image provided or file is empty.");
  }

  // PARSE TIME SLOTS
  // Expected format: "Monday: 05:00-10:00, 17:00-21:00; Tuesday: 05:00-10:00, 17:00-21:00"
  const timeSlots: Record<string, string[]> = {};

  if (timeSlotsRaw) {
    console.log("raw entry passed");
    const days = timeSlotsRaw.split(";");
    console.log(days);
    days.forEach((day) => {
      const [dayName, slots] = day.split(":-");
      console.log([dayName,slots]);
      if (dayName && slots) {
        const trimmedDay = dayName.trim();
        const slotArray = slots
          .split(",")
          .map((slot) => slot.trim())
          .filter((slot) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)); // Basic validation
        if (slotArray.length > 0) {
          timeSlots[trimmedDay] = slotArray;
        }
      }
    });
  }

  // VALIDATE TIME SLOTS
  if (Object.keys(timeSlots).length === 0) {
    throw new Error("Invalid or missing time slots format.");
  }

  // CREATE COURT DOCUMENT IN APPWRITE DATABASE
  try {
    await database.createDocument(
      process.env.DATABASE_ID!,            // Your Appwrite database ID
      process.env.COURTS_COLLECTION_ID!,   // Your courts collection ID
      "unique()",                          // Unique document ID
      {
        courtName,
        courtImage: courtImageUrl,
        location,
        type,
        maxTime,
        minUsers,
        timeSlots: JSON.stringify(timeSlots), // Store as JSON string
        addedBy: user.email,                    // Use the correct user ID property
      }
    );

    console.log("Court created successfully.");
    // Optionally, revalidate paths or perform other actions
  } catch (error) {
    console.error("Failed to create court:", error);
    throw new Error("Failed to create court");
  }
// console.log(
//   {
//           courtName,
//           courtImage: courtImageUrl,
//          location,
//           totalCourts,
//           maxTime,
//           minUsers,
//           timeSlots: JSON.stringify(timeSlots), // Store as JSON string
//          addedBy: user.id,                    // Use the correct user ID property
//        }


  redirect("/inventory");
}

//Deleting Court Item

export async function DeleteCourtItem(
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
      process.env.COURTS_COLLECTION_ID!,
      itemId
    );

    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      process.env.COURTBOOKINGS_COLLECTION_ID!,
      [Query.equal("courtId", [itemId])]
    );

    for (const doc of response.documents){
      await database.deleteDocument(
        process.env.DATABASE_ID!,
        process.env.COURTBOOKINGS_COLLECTION_ID!,
        doc.$id
        );
    }

    revalidatePath(`/inventory-admin`);
  } catch (error) {
    console.error("Failed to delete booking request:", error);
    throw new Error("Failed to delete booking request");
  }
}

//Modify Inventory Item
export async function ModifyCourtItem(itemId: string, formdata: FormData) {
  // VERIFYING USER
  const user = await getUser();

  if (!user) {
    redirect("/");
    return;
  }

  // EXTRACTING FORM DATA
  const courtName = formdata.get("courtName") as string;
  const courtImage = formdata.get("courtImage") as string; // Corrected key
  const type= formdata.get("type") as string;
  const minUsers = parseInt(formdata.get("min-users") as string, 10);
  const location = formdata.get("location") as string;
  const timeSlotsRaw = formdata.get("timeSlots") as string;
  const maxTime = parseInt(formdata.get("allowed-time") as string, 10);
  const timeSlots: Record<string, string[]> = {};

  if (timeSlotsRaw) {
    console.log("raw entry passed");
    const days = timeSlotsRaw.split(";");
    console.log(days);
    days.forEach((day) => {
      const [dayName, slots] = day.split(":-");
      console.log([dayName,slots]);
      if (dayName && slots) {
        const trimmedDay = dayName.trim();
        const slotArray = slots
          .split(",")
          .map((slot) => slot.trim())
          .filter((slot) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)); // Basic validation
        if (slotArray.length > 0) {
          timeSlots[trimmedDay] = slotArray;
        }
      }
    });
  }

  // VALIDATE TIME SLOTS
  if (Object.keys(timeSlots).length === 0) {
    throw new Error("Invalid or missing time slots format.");
  }

  console.log(timeSlots);
  try{
    await database.updateDocument(
      process.env.DATABASE_ID!,              // Your Appwrite database ID
      process.env.COURTS_COLLECTION_ID!,
      itemId,
      {
        courtName:courtName,
        courtImage:courtImage,
        location: location,
        type: type,
        maxTime: maxTime,
        minUsers:minUsers,
        timeSlots:JSON.stringify(timeSlots)
      }
    )
  }catch(error){
    console.error("Failed to modify court", error);
    throw new Error("Failed to modify court");
  }
}