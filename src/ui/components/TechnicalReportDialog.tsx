import React from "react";
import { VERSION as PixiVersion } from "pixi.js";
import { ReactComponent } from "../../engine/ReactComponent";
import { Dialog } from "./Dialog";
import { Box, Grid, CardHeader, Divider } from "@mui/material";
import { BasicButton } from "../Theme";
import { MessageBar } from "./MessageBar";
import { DB } from "../../Database";
import { WindowManager } from "../../engine/WindowManager";
import { Platform } from "../../engine/Platform";
import { System } from "../../engine/System";

interface TechnicalReportDialogProps {
  open: boolean;
}

class TechnicalReportDialog_0 extends ReactComponent<TechnicalReportDialogProps> {
  init() {
    return {
      open: false,
    };
  }

  renderData() {
    if (!this.props.open) {
      return {};
    }

    const renderNavigator = () => {
      const { language, languages, userAgent, platform } = window.navigator;
      let { connection } = window.navigator as any;
      const { userAgentData } = window.navigator as any;
      if (connection) {
        const { downlink, downlinkMax, effectiveType, rtt, saveData, type } =
          connection;
        connection = {
          downlink,
          downlinkMax,
          effectiveType,
          rtt,
          saveData,
          type,
        };
      }
      return {
        language,
        languages,
        connection,
        userAgent,
        userAgentData,
        platform,
      };
    };

    const renderApp = () => {
      return {
        url: System.url.href,
        database: DB.read(),
        devicePixelRatio: window.devicePixelRatio,
        resolution: [
          WindowManager.renderer.width,
          WindowManager.renderer.height,
        ],
        platform: {
          isMobile: Platform.isMobile,
          isWebkit: Platform.isWebKit,
        },
        versions: {
          package: {
            // git: __COMMIT_HASH__,
            // version: __APP_VERSION__,
          },
          react: React.version,
          pixijs: PixiVersion,
        },
      };
    };

    const renderDocument = () => {
      const { cookie } = window.document;
      const tags = ["*", "div", "img", "svg", "canvas"];
      const count = {};
      for (const tag of tags) {
        count[tag] = document.getElementsByTagName(tag).length;
      }
      const { clientWidth, clientHeight } = window.document.body;
      return { cookie, count, body: { clientWidth, clientHeight } };
    };

    const renderPerformance = () => {
      const { timeOrigin, timing } = window.performance;
      let { memory } = window.performance as any;
      if (memory) {
        const { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize } = memory;
        memory = {
          jsHeapSizeLimit,
          totalJSHeapSize,
          usedJSHeapSize,
        };
      }
      return {
        memory,
        timeOrigin,
        timing,
      };
    };

    const renderWebGL = () => {
      const gl = !!window.WebGLRenderingContext;
      const gl2 = !!window.WebGL2RenderingContext;
      return {
        gl,
        gl2,
      };
    };

    return {
      navigator: renderNavigator(),
      app: renderApp(),
      document: renderDocument(),
      performance: renderPerformance(),
      webgl: renderWebGL(),
    };
  }

  render(): React.ReactNode {
    const lines = JSON.stringify(this.renderData(), null, 2);
    const handleCopyAll = async () => {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(lines);
        MessageBar.success(`technical report copied`);
        await this.update({ open: false });
      } else {
        console.log(lines);
        MessageBar.warning(`logged to console since context is not secure`);
      }
    };
    return (
      <Dialog open={this.props.open}>
        <CardHeader title={<>Technical Report</>}></CardHeader>
        <Divider sx={{ pt: 2 }} />
        <Box
          sx={{
            maxHeight: 640,
            maxWidth: 800,
            overflow: "auto",
          }}
        >
          <pre
            style={{
              fontSize: 16,
              fontFamily: "consolas,courier new,ui-sans-serif,system-ui",
              userSelect: "all",
              whiteSpace: "pre-wrap",
            }}
          >
            {lines}
          </pre>
        </Box>
        <Grid container spacing={2} justifyContent="flex-end" sx={{ pt: 4 }}>
          <Grid item xs={4}>
            <BasicButton fullWidth onClick={handleCopyAll}>
              Copy All
            </BasicButton>
          </Grid>
          <Grid item xs={4}>
            <BasicButton fullWidth onClick={() => this.update({ open: false })}>
              Dismiss
            </BasicButton>
          </Grid>
        </Grid>
      </Dialog>
    );
  }
}

export const TechnicalReportDialog = new TechnicalReportDialog_0();
