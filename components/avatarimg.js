import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarImg({w,h,avatar, username}) {

  const name_initials = username
    .split(" ") // Split by space → ["Varinder", "Dhillon"]
    .map((word) => word[0]) // Get first letter of each word → ["V", "D"]
    .join("");

  return (
    <>
      <Avatar className={`w-${w} h-${h}`}>
        <AvatarImage src={avatar} />
        <AvatarFallback>{name_initials}</AvatarFallback>
      </Avatar>
    </>
  );
}
