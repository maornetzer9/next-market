import { Navigate, useLocation } from "react-router-dom";
import { InitialViewReady } from "../UI/LoadingCoordinator";

export default function AuthRouteAdapter({ mode = "sign-in" }) {
  const location = useLocation();

  return (
    <InitialViewReady>
      <Navigate
        to="/"
        replace
        state={{
          authModal: mode === "register" ? "register" : "sign-in",
          from: location.state?.from || null,
        }}
      />
    </InitialViewReady>
  );
}
