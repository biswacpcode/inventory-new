import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getISTTime = () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })

export const formatISTDate = (date: Date) =>
  date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

export const formatISTTime = (date: Date) =>
  date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

export const formatISTDateTime = (date: Date) =>
  date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  // export function formatDateTime(isoString: string): string {
  //   const date = new Date(isoString);
  //   const options: Intl.DateTimeFormatOptions = {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //     hour: 'numeric',
  //     minute: '2-digit',
  //     hour12: true,
  //     timeZone: "IST",         // <-- this is the key
  //     timeZoneName: 'short',
  //   };
  //   const result = date.toLocaleString('en-IN', options);
  //   const formatted = result.replace('UTC', 'IST');
  //   return formatted;
  // }

  export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // ✅ Correct timezone
    timeZoneName: "short",
  };
  return date.toLocaleString("en-IN", options); 
}

export function formatDateTime2(isoString: string): string {
  // Remove timezone info so JS doesn't convert it
  const cleanString = isoString.split("+")[0].split("Z")[0];
  const date = new Date(cleanString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-hour format
    timeZoneName: "short",
  };

  // Format without converting the time
  return date.toLocaleString("en-IN", options).replace("GMT+5:30", "IST");
}

export function localToUTC(localDateTime: string): string {
  // Parse the local datetime string into a Date object
  const date = new Date(localDateTime);

  // Return as an ISO string in UTC (always ends with 'Z')
  return date.toISOString();
}
