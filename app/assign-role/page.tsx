"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
 // Import necessary actions
import { Input } from "@/components/ui/input";
import Loading from "@/components/layout/Loader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { Models } from "node-appwrite";
import { ReadAllUsersByRoleOrSearch } from "@/lib/action";

interface Users {
  $id: string;
  id: any;
  name: string;
  email: any;
  role: any;
  originalRole: any;
  socName: string;
}

export default function AssignRolesPage() {
  const [users, setUsers] = useState<Users[] | undefined>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [societies, setSocieties] = useState<Models.Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>("");

  async function checkAuthorization() {
    // const isAdmin = await checkRole("Admin");
    // if (!isAdmin) {
    //   alert("You are unauthorized.");
    //   // Redirect if unauthorized
    //   window.location.href = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!;
    // } else {
      fetchUsers(); // Fetch data if authorized
    // }
  }

  async function fetchUsers() {
    const fetchedUsers = await ReadAllUsersByRoleOrSearch(searchTerm);
    setUsers(fetchedUsers ?? []);
    //const societies = await fetchUsersByRole("Society");
    //setSocieties(societies);

  }

  async function searchUser() {
    const fetchedUsers = await ReadAllUsersByRoleOrSearch(searchTerm);
    setUsers(fetchedUsers ?? []);
  }

  async function Reset(userId: string){
    setLoading(true);
    setCurrentUser(userId);
    //ResetUserRole(userId).then(()=>window.location.reload())

  }

  useEffect(() => {
    checkAuthorization();
  }, []);
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">Assign Roles</h1>
      </div>
      <div className="mb-6">
        {/* Wrap Input and Button in a flex container */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background shadow-none appearance-none pl-8"
            />
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Search Button aligned next to input */}
          <Button onClick={() => searchUser()}>Search</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users ? users.length > 0 ? (
              users.map((user) => (
                <TableRow
                  key={user.$id}
                  className="border-b border-gray-200 hover:bg-muted"
                >
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {/* Role change addition */}
                    <Select
                      value={user.role}
                    //   onValueChange={(newRole) => {
                    //     // Handle role change
                    //     UpdateUserRole(user.$id, newRole)
                    //       .then(() => fetchUsers())
                    //       .catch((err) => console.error(err));
                    //   }}
                    >
                      <SelectTrigger className="my-2">

                        <SelectValue placeholder={user.role} />
                      </SelectTrigger >
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Roles</SelectLabel>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Society">Society</SelectItem>
                        <SelectItem value="Council">Council</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Student">Student</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {/* Conditionally display another select if "Society" is chosen */}
                    {user.role === "Society" && (
                      <Select
                        onValueChange={(societyId) => {
                          // Handle society type selection
                        //   AssignSociety(user.$id, societyId)
                        //   .then(() => searchUser())
                        //   .catch((err) => console.error(err));
                        }}
                      >
                        <SelectTrigger className="my-2">
                          {user.id!==user.$id ? (
                            <SelectValue placeholder={user.socName} />
                          ):(
<SelectValue placeholder="Select new society" />
                          )}
                          
                        </SelectTrigger>
                        <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Societies</SelectLabel>
                        {
                    societies.map((society) => (
                      <SelectItem key={society.$id} value={society.id}>{society.firstName} {society.lastName}</SelectItem>
                    ))
                  }
                  </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Action buttons */}

                    {loading && currentUser === user.$id? (
                      <Loading/>):
                      user.id !== user.$id || user.role!==user.originalRole? (
                      <Button size="sm" onClick={() => Reset(user.$id)}>
                        Reset Role
                      </Button>
                    ) : (
                      <></>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No matching users found.
                </TableCell>
              </TableRow>
            ):(<TableRow>
              <TableCell colSpan={4} className="text-center">
                No matching user found.
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
