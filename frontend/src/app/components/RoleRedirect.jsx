"use client";
import { useEffect } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function RoleRedirect() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;

    const role = user?.publicMetadata?.role;

    switch (role) {
      case "student":
        router.replace("/student");
        break;
      case "staff":
        router.replace("/staff");
        break;
      case "hod":
        router.replace("/hod");
        break;
      case "coe":
        router.replace("/coe");
        break;
      case "assistant-coe":
        router.replace("/assistant-coe");
        break;
      case "chairman":
        router.replace("/chairman");
        break;
      case "admissions-application-entry":
        router.replace("/admissionApplicationEntry");
        break;
      case "office-admissions":
        router.replace("/officeAdmissions");
        break;
      case "admin":
      case "principal":
      case "registrar":
        router.replace("/admin");
        break;
      default:
        router.replace("/students");
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="flex items-center justify-center h-screen text-gray-600">
      Redirecting to your dashboard...
    </div>
  );
}
