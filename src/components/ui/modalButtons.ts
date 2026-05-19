import type { SxProps, Theme } from "@mui/material/styles";

// Shared MUI Button sx for the modal popups (PR #6). The Figma popups use
// two button styles — NUR / Button primary (purple gradient + glow) and
// NUR / Button secundary (white, purple border). LoginModal, RegisterModal
// and TopicsModal all draw from here so the gradient/glow values live once.
//
// Width is left to the caller: LoginModal uses `fullWidth`; the Register
// and Topics footer buttons hug their label (px:3 gives the 24px Figma
// horizontal padding).

const PURPLE_GRADIENT =
  "linear-gradient(-31.886deg, var(--color-brand-purple-light) 0.643%, var(--color-brand-purple) 59.555%)";

export const primaryButtonSx: SxProps<Theme> = {
  height: 48,
  px: 3,
  borderRadius: "var(--radius-card)",
  color: "#ffffff",
  textTransform: "none",
  fontWeight: 500,
  fontSize: "var(--text-body)",
  backgroundImage: PURPLE_GRADIENT,
  boxShadow: "var(--shadow-purple-glow-medium)",
  "&:hover": {
    backgroundImage: PURPLE_GRADIENT,
    boxShadow: "var(--shadow-purple-glow-medium)",
    opacity: 0.92,
  },
  "&.Mui-disabled": {
    backgroundImage: PURPLE_GRADIENT,
    color: "#ffffff",
    opacity: 0.5,
    boxShadow: "var(--shadow-purple-glow-medium)",
  },
};

export const secondaryButtonSx: SxProps<Theme> = {
  height: 48,
  px: 3,
  borderRadius: "var(--radius-card)",
  color: "var(--color-brand-purple)",
  backgroundColor: "#ffffff",
  border: "1px solid var(--color-brand-purple)",
  textTransform: "none",
  fontWeight: 500,
  fontSize: "var(--text-body)",
  "&:hover": {
    backgroundColor: "var(--color-brand-purple-5)",
    border: "1px solid var(--color-brand-purple)",
  },
};
