import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// Shared controlled-input + submit handler for both Header (logged-out)
// and HeaderLoggedIn (logged-in) search forms. Keeps them in sync and
// avoids forking the navigation logic (NIC-41 F4/F6).

export function useHeaderSearch() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    navigate(`/search/articles?q=${encodeURIComponent(t)}`);
  }

  function onMobileIconClick() {
    navigate("/search/articles");
  }

  return { value, setValue, onSubmit, onMobileIconClick };
}
