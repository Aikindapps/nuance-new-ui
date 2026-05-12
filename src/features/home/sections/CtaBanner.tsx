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
    <section className="bg-brand-gradient flex flex-col items-start gap-8 overflow-hidden rounded-[24px] p-8 text-white md:flex-row md:items-center md:justify-between md:p-12 lg:py-20 lg:pr-16 lg:pl-[66px] xl:pl-[120px]">
      <div className="max-w-[452px]">
        <h2 className="text-[32px] font-bold leading-tight md:text-[40px] md:leading-[40px]">
          {ctaBannerCopy.heading}
        </h2>
        <p className="mt-4 text-body">{ctaBannerCopy.body}</p>
      </div>

      <div className="flex w-full flex-col gap-5 md:w-[280px] md:shrink-0">
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
