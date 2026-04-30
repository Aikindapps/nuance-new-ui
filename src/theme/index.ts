import { createTheme } from "@mui/material/styles";

// MUI theme that mirrors the canonical CSS-variable definitions in
// src/index.css (@theme block). Decisions #19 + #23: `@theme` is the
// single source of truth for tokens; this MUI theme references those
// CSS variables via `var(--*)` so both layers stay in sync without a
// codegen step.
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "var(--color-brand-purple)",
      light: "var(--color-brand-purple-light)",
      contrastText: "#ffffff",
    },
    text: {
      primary: "var(--color-ink)",
      secondary: "var(--color-ink-80)",
      disabled: "var(--color-ink-60)",
    },
    background: {
      default: "var(--color-surface)",
      paper: "var(--color-surface)",
    },
    divider: "var(--color-ink-border)",
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-sans)",
    body1: {
      fontSize: "var(--text-body)",
      lineHeight: "28px",
    },
    h1: {
      fontSize: "var(--text-title-lg)",
      lineHeight: "44px",
      letterSpacing: "-0.72px",
      fontWeight: 700,
    },
    h2: {
      fontSize: "var(--text-title-sm)",
      lineHeight: "36px",
      letterSpacing: "-0.48px",
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 9999,
          paddingInline: 24,
          paddingBlock: 12,
          fontSize: "var(--text-body)",
          fontWeight: 700,
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            backgroundColor: "var(--color-brand-purple)",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "var(--color-brand-purple-light)",
            },
          },
        },
        {
          props: { variant: "text", color: "primary" },
          style: {
            color: "var(--color-brand-purple)",
            "&:hover": {
              backgroundColor: "var(--color-white-10)",
            },
          },
        },
      ],
    },
    MuiSkeleton: {
      defaultProps: {
        animation: "pulse",
      },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(32, 33, 35, 0.12)",
        },
      },
    },
  },
});
