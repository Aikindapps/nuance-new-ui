import Button from "@mui/material/Button";
import { useModal } from "../../../services/modal";
import {
  LoginModal,
  LOGIN_MODAL_TITLE_ID,
} from "../../../components/LoginModal/LoginModal";
import { ctaBannerCopy } from "../../../constants/copy";

// CtaBanner is logged-out-exclusive: HomeLoggedOut is its only mount point
// (PR #4 routing split, decision #26). The previous self-hide-when-authed
// guard was removed alongside the split.

export function CtaBanner() {
  const modal = useModal();

  const openLogin = () =>
    modal.open(<LoginModal />, { ariaLabelledBy: LOGIN_MODAL_TITLE_ID });

  return (
    <section className="bg-brand-gradient flex flex-col items-start gap-8 overflow-hidden rounded-[calc(24*var(--fpx))] p-8 text-white md:flex-row md:items-center md:justify-between md:p-12 lg:py-20 lg:pr-16 lg:pl-[calc(66*var(--fpx))] xl:pl-[calc(120*var(--fpx))]">
      <div className="max-w-[calc(452*var(--fpx))]">
        <h2 className="text-[length:calc(32*var(--fpx))] font-bold leading-tight md:text-[length:calc(40*var(--fpx))] md:leading-[calc(40*var(--fpx))]">
          {ctaBannerCopy.heading}
        </h2>
        <p className="mt-4 text-body">{ctaBannerCopy.body}</p>
      </div>

      <div className="flex w-full flex-col gap-5 md:w-[calc(280*var(--fpx))] md:shrink-0">
        <Button
          onClick={openLogin}
          variant="contained"
          fullWidth
          sx={{
            height: 48,
            borderRadius: "var(--radius-card)",
            backgroundColor: "#ffffff",
            color: "var(--color-brand-purple)",
            "&:hover": { backgroundColor: "#ffffff", opacity: 0.9 },
          }}
        >
          {ctaBannerCopy.primary}
        </Button>
        <Button
          onClick={openLogin}
          variant="outlined"
          fullWidth
          sx={{
            height: 48,
            borderRadius: "var(--radius-card)",
            backgroundColor: "transparent",
            borderColor: "#ffffff",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "var(--color-white-10)",
              borderColor: "#ffffff",
            },
          }}
        >
          {ctaBannerCopy.secondary}
        </Button>
      </div>
    </section>
  );
}
