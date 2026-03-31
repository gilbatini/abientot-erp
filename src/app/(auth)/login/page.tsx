import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl font-display mx-auto mb-4">
          A
        </div>
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
