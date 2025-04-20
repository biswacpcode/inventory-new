'use server'
import { ID, Models, Query } from "node-appwrite";
import { database} from "./appwrite.config";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
const {
    DATABASE_ID, USER_COLLECTION,BLOCKED_COLLECTION_ID,
} = process.env;
// Getting User Id from Email
export async function getUserId(email:string) {
    const response = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION!, 
      [Query.equal("email", email)]
    );
  
    return response.documents[0].$id;
  }
  // Geting Server user Info
  export async function getUser(){
      const session = await getServerSession(authOptions);
      if (session){
        const user = {
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
          id: await getUserId(session?.user?.email!)
        };
        return user;
      }
      return null;
      
    
  };
  
  //Checking existing User
  export async function checkExistence(email: string){
    const response = await database.listDocuments(
        DATABASE_ID!,
      USER_COLLECTION!, 
      [Query.equal("email", email)]
    );
  
    if (response.documents.length>0)
      return true;
    else
    return false;
  }

  //Getting the Role of the User
  export async function GetRole(email?:string){
    const emailToSearch = email || (await getUser())?.email;
    if (emailToSearch){
      const response = await database.listDocuments(
        DATABASE_ID!,
        USER_COLLECTION!, 
        [Query.equal("email", emailToSearch)]
      );

      return response.documents[0].role;
    }
    else
    return;
    
  }

// Creating New User

export async function CreateNewUser(name:string, email: string, image: string, role: string) {
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.splice(1).join(" ");
  const id = ID.unique();
  try{
    await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION!,
      id,
      {
        id:id,
        firstName,
        lastName,
        email,
        role,
        imageUrl: image,
      }
    )
  }catch(error){
    console.error("Error create new user :", error);
    throw new Error ("Error create new user : ");
  }
}

export async function ReadUserById(userId: string) {
  console.log(userId)
  // if (userId===null)
  //   return;
  try {
    // Fetch a single inventory item by ID
    const response = await database.getDocument(
      DATABASE_ID!,
      USER_COLLECTION!,
      userId
    );

    // Map the document to the InventoryItem type
    const user = {
      $id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      email: response.email,
    };

    return user;
  } catch (error) {
    console.error("Failed to read user:", error);
    throw new Error("Failed to read user");
  }
}

//Read user by email
export async function ReadUserByEmail(email: string): Promise<Models.Document | null> {
  try {
    const users = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION!,
      [Query.equal("email", [email])]
    );

    if (users.total > 0) {
      return users.documents[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw new Error("Failed to fetch user by email.");
  }
}


/// Read All Role Users / Searched user.

export async function ReadAllUsersByRoleOrSearch(search: string, role?: string)
{
  if (search !=="")
  {
    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      USER_COLLECTION!,
      [Query.equal("email", [search])]
    );

    const doc = response.documents[0];
    if (!doc)
      return await ReadAllUsersByRoleOrSearch("", search);
    else{
      const user = await ReadUserById(doc.id);
      const userfetched = {
        $id: doc.$id,
        id: doc.id,
        name: `${doc.firstName} ${doc.lastName}`,
        email: doc.email,
        role: doc.role,
        originalRole: (doc.originalRole)?doc.originalRole:doc.role,
        socName: `${user.firstName} ${user.lastName}`
      }
      return [userfetched];
    }
    
  }else if (role){
    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      USER_COLLECTION!,
      [Query.equal("role", [role])]
    );
    const fetchedusers = await Promise.all(
      response.documents.map(async (doc) => {  
        const user = await ReadUserById(doc.id);
        return{
          $id: doc.$id,
      id: doc.id,
      name: `${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      role: doc.role,
      originalRole: (doc.originalRole)?doc.originalRole:doc.role,
      socName: `${user.firstName} ${user.lastName}`
        }
    }));
    return fetchedusers;
  }
  else{
    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      USER_COLLECTION!,
      [Query.equal("role", ["Admin", "Society", "Council"])]
    );

    const fetchedusers = await Promise.all(
      response.documents.map(async (doc) => {  
        const user = await ReadUserById(doc.id);
        return{
          $id: doc.$id,
      id: doc.id,
      name: `${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      role: doc.role,
      originalRole: (doc.originalRole)?doc.originalRole:doc.role,
      socName: `${user.firstName} ${user.lastName}`
        }
    }));
    return fetchedusers;
  }
}


//Blocking the users

export async function BlockUsers(emails: string[], startDate: Date, endDate: Date){
  const start = startDate.toISOString();
  const end = endDate.toISOString();
    try{
      for (const email of emails){
        await database.createDocument(
          DATABASE_ID!,
          BLOCKED_COLLECTION_ID!,
          "unique()",
          {
            email,
            start,
            end
          }
        )
      }

    }catch(error){
      console.error("Failed to block the users : ", error);
      throw new Error("Failed to block the users")
    }
}

//Checking Blocked Status
export async function CheckBlocked(email?: string){
  const user = await getUser();
  if(!user){
    return;
  }
  if(user){
    const useremail = user.email;

    const response = await database.listDocuments(
      DATABASE_ID!,
      BLOCKED_COLLECTION_ID!,
      [Query.equal("email",[email || useremail!])]
    )

    if(response.total>0){
      const doc = response.documents[0];
      const end = new Date(doc.end);
      const current = new Date();
      if (current > end)
      {
        await database.deleteDocument(
          DATABASE_ID!,
          BLOCKED_COLLECTION_ID!,
          doc.$id
        );
        return false;
      }else{
        return true;
      }
    }else{
      return false;
    }
  
  }
 
}



export async function UnBlockUsers(emails: string[]){
    try{
      for (const email of emails){
        const response = await database.listDocuments(
          DATABASE_ID!,
          BLOCKED_COLLECTION_ID!,
          [Query.equal("email", [email])]
        )
        if(response.documents.length>0)
        {
          await database.deleteDocument(
            DATABASE_ID!,
            BLOCKED_COLLECTION_ID!,
            response.documents[0].$id
          );
        }
      }

    }catch(error){
      console.error("Failed to block the users : ", error);
      throw new Error("Failed to block the users")
    }
}


// FETCH USERS BY ROLE
export async function fetchUsersByRole(role: string) {
  try {
    const response = await database.listDocuments(
      process.env.DATABASE_ID!,
      USER_COLLECTION!,
      [Query.equal("role", [role])]
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching users by role:", error);
    throw new Error("Failed to fetch users by role");
  }
}



//uPDATING rOLE

export const UpdateUserRole = async (
  userId: string,
  newRole: string,
) => {
  const user = await database.getDocument(
    process.env.DATABASE_ID!,
    USER_COLLECTION!,
    userId
  );

  // Store original role and society if not already stored
  if (!user.originalRole) {
    user.originalRole = user.role;
  }

  // Update role and society
  user.role = newRole;

  await database.updateDocument(
    process.env.DATABASE_ID!,
    USER_COLLECTION!,
    userId,
    {
      role:newRole,
      originalRole:user.originalRole
    }
  );
};

//Assign Society
export const AssignSociety = async (
  userId: string,
  societyId: string,
) => {
  const user = await database.getDocument(
    process.env.DATABASE_ID!,
    USER_COLLECTION!,
    userId
  );

  // Store original role and society if not already stored
  if (user.id===societyId) {
    return;
  }
  try{
    await database.updateDocument(
      process.env.DATABASE_ID!,
      USER_COLLECTION!,
      userId,
      {
        id: societyId,
      }
    );
  }catch(error){
    console.error("Failed to assign Society ", error);
    throw new Error("Failed to assign Society");
  }

  
};

//ResetUserRole
export const ResetUserRole = async (userId: string) => {
  const user = await database.getDocument(
    process.env.DATABASE_ID!,
    USER_COLLECTION!,
    userId
  );

  if (!user.originalRole) {
    user.originalRole=user.role;
  }

  user.role = user.originalRole;
  user.id = user.$id;

  await database.updateDocument(
    process.env.DATABASE_ID!,
    USER_COLLECTION!,
    userId,
    {
      role: user.originalRole,
      id:user.$id,
      originalRole : user.originalRole
    }
  );
};
