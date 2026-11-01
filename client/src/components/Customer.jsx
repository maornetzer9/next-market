import React from "react";
import { AuthModalProvider, useAuthModal } from "../auth/AuthModalContext";
import NavbarModel from "./Navbar-Model/NavbarModel";
import ToastRoot from "../UI/ToastRoot";

function CustomerShell() {
  const { openAuthModal } = useAuthModal();

  return (
    <>
      <NavbarModel
        menuHeader="Customer Menu"
        variant="customer"
        onOpenSignIn={(trigger) => openAuthModal("sign-in", null, trigger)}
        onOpenRegister={(trigger) => openAuthModal("register", null, trigger)}
      />
      <ToastRoot />
    </>
  );
}

export default function Customer() {
  return (
    <AuthModalProvider>
      <CustomerShell />
    </AuthModalProvider>
  );
}
