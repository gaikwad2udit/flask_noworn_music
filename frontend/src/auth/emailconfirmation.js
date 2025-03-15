// EmailConfirmation.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { confirmEmail } from "./authService";

const EmailConfirmation = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const confirm = async () => {
      try {
        await confirmEmail(token);
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        setError("Invalid or expired confirmation link");
      }
    };
    confirm();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {error ? (
            <div className="text-red-500 text-lg">{error}</div>
          ) : (
            <>
              <div className="text-green-500 text-lg mb-4">✓</div>
              <div className="text-gray-700 text-lg">{message}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
