import React from "react";
import ReactDOM from "react-dom/client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@rainbow-me/rainbowkit/styles.css";

import { wagmiConfig } from "./wagmi.config";
import App from "./App";

const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el elemento root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <Notifications position="top-right" />
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme()} modalSize="compact">
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MantineProvider>
  </React.StrictMode>,
);
