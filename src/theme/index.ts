import { createTheme } from "@mui/material/styles";

// MUI theme that mirrors the canonical CSS-variable definitions in
// src/index.css (@theme block). Decisions #19 + #23.
//
// Palette colors are hardcoded hex/rgba (not `var(--*)`) because MUI's
// createPalette calls darken()/lighten() on every `main` to derive
// dark/light variants, and color-manipulator can't decompose CSS-var
// strings. Keep these in sync with the @theme block by hand. Typography
// and component style overrides below DO use `var(--*)` since MUI
// passes those through to CSS as-is.
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#5405d4",
      light: "#935bfb",
      contrastText: "#ffffff",
    },
    text: {
      primary: "#202123",
      secondary: "rgba(32, 33, 35, 0.8)",
      disabled: "rgba(32, 33, 35, 0.6)",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    divider: "#373a49",
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
