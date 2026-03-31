import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Image src="/logo.svg" alt="AlgoriOffice" width={180} height={50} className="mx-auto mb-4" />
        <h1 className="font-display text-2xl font-semibold text-gray-900">AlgoriOffice</h1>
        <p className="text-sm text-gray-500 mt-1">À Bientôt Tour & Travels</p>
        <p className="text-xs text-gray-400 mt-0.5">by Algorivia</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <LoginForm />
      </div>
    </div>
  );
}
