"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchUser } from "../redux/slices/authslice";

import { ToastContainer } from "react-toastify";
import GlobalSocketListener from "./components/SocketListener";

export default function ClientLayout({ children }) {
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);

  const hasFetchedRef = useRef(false);

  /* 🔄 Fetch user once */

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;

      dispatch(fetchUser());
    }
  }, [dispatch]);

  return (
    <>
      {children}

      {/* Socket only if login */}

      {isAuthenticated && <GlobalSocketListener />}

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
}
