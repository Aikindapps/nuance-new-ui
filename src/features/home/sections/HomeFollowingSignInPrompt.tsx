import Button from "@mui/material/Button";
import { useModal } from "../../../services/modal";
import {
  LoginModal,
  LOGIN_MODAL_TITLE_ID,
} from "../../../components/LoginModal/LoginModal";
import { primaryButtonSx, secondaryButtonSx } from "../../../components/ui/modalButtons";
import { homeFollowingGate } from "../../../constants/copy";

// Logged-out Following sort → sign-in prompt (NIC-326). The Following sort is
// the only gated control on the logged-out Home; selecting it shows this block
// instead of a feed. Both buttons open the single LoginModal (II auth entry) —
// same pattern as CtaBanner / FollowButton.
export function HomeFollowingSignInPrompt() {
  const modal = useModal();
  const openLogin = () =>
    modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });

  return (
    <div className="rounded-card border border-ink-border/20 bg-ink-60/5 p-12 text-center md:p-16">
      <h2 className="text-title-sm font-bold text-ink">
        {homeFollowingGate.heading}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-body text-ink-80">
        {homeFollowingGate.body}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="contained" sx={primaryButtonSx} onClick={openLogin}>
          {homeFollowingGate.signupLabel}
        </Button>
        <Button variant="outlined" sx={secondaryButtonSx} onClick={openLogin}>
          {homeFollowingGate.loginLabel}
        </Button>
      </div>
    </div>
  );
}
