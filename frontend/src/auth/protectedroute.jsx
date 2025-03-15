import { Navigate, useLocation, Outlet } from "react-router-dom";
import { usePlayer } from "../contexts/PlayerContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = usePlayer();
  const location = useLocation();

  //   console.log(currentUser);
  if (currentUser === null) {
    console.log("redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
