import { ReactNode, useState, useEffect, useRef } from "react";
import { ReactComponent } from "../../../engine/ReactComponent";
import { Dialog } from "../../components/Dialog";
import { CardLarge } from "../../components/CardLarge";
import {
  Grid,
  Box,
  CardHeader,
  Checkbox,
  Divider,
  Typography,
  FormControlLabel,
} from "@mui/material";
import { System } from "../../../engine/System";
import { measureTextWidth, renderQrCode } from "../../../engine/Utils";
import { CardSmall } from "../../components/CardSmall";
import { BasicButton, SplitButton } from "../../Theme";
import { DB } from "../../../Database";
import { LoadingDialog } from "../../components/LoadingDialog";
import { MessageBar } from "../../components/MessageBar";
import { getDeckTotalArea } from "../../../Terms";
import { DeckPanel } from "./DeckPanel";

function formatUrl(deck: IDeckData) {
  const url = new URL(System.url.origin);
  url.searchParams.append("deck", JSON.stringify(deck.deck));
  return url.href;
}

interface DeckShareDialogProps {
  open: boolean;
  deck: IDeckData;
  url: string;
  qrcode: string;
  resolve: any;
}

class DeckShareDialog_0 extends ReactComponent<DeckShareDialogProps> {
  init() {
    return {
      open: false,
      deck: null,
      url: "",
      qrcode: "",
      resolve: () => {},
    };
  }

  async prompt(): Promise<void> {
    const deck = {
      name: "Untitled",
      ...DB.read().decks[DeckPanel.props.deck],
      deck: DeckPanel.props.cards.slice(),
    };
    let resolve;
    const promise = new Promise<void>((_) => (resolve = _));
    await this.update({
      open: true,
      deck,
      url: formatUrl(deck),
      qrcode: "",
      resolve: async (ok) => {
        await this.update({ open: false });
        resolve(ok);
      },
    });
    return await promise;
  }

  render(): ReactNode {
    const rootRef = useRef(null);

    useEffect(() => {
      const { url } = this.props;
      if (!url) {
        return;
      }
      renderQrCode(url, {
        errorCorrectionLevel: "L",
        margin: 0,
        color: {
          light: "#0f0f0f",
          dark: "#ffffff",
        },
      }).then((qrcode) => {
        if (this.props.url == url) {
          this.update({ qrcode });
        }
      });
    }, [this.props.url, this.props.resolve]);

    const [state, setState] = useState({
      portrait: false,
      dark: true,
    });

    const renderContent = () => {
      const cards = this.props.deck.deck.map((card) => (
        <Grid item xs={2.4} key={card}>
          <Box sx={{ p: 1 }}>
            {state.portrait ? (
              <div style={{ pointerEvents: "none" }}>
                <CardLarge width={100} card={card} />
              </div>
            ) : (
              <div style={{ pointerEvents: "none" }}>
                <CardSmall width={100} card={card} />
              </div>
            )}
          </Box>
        </Grid>
      ));

      return (
        <Box
          ref={rootRef}
          sx={{
            position: "relative",
            width: 600,
            height: 600,
            background: state.dark ? "#0f0f0f" : "#efefef",
            p: 2,
            overflow: "hidden",
          }}
        >
          <Grid container sx={{ width: "100%", height: "100%" }}>
            <Grid item container xs={12} sx={{ height: 400 }}>
              {cards}
            </Grid>
            <Grid
              item
              container
              flexDirection={"row-reverse"}
              alignItems="flex-end"
              xs={12}
              sx={{ flexGrow: 1, p: 1, pb: 0 }}
            >
              <Grid
                item
                container
                alignItems="flex-end"
                justifyContent="flex-end"
                sx={{ width: 130 }}
              >
                <Grid item>
                  <img
                    src={this.props.qrcode}
                    style={{ width: 130, height: 130 }}
                  />
                </Grid>
              </Grid>
              <Grid item sx={{ width: 450 }}>
                <CardHeader
                  title={
                    <Typography noWrap gutterBottom variant="h6" component="h4">
                      {this.props.deck.name}
                    </Typography>
                  }
                  subheader={`by: ${DB.read().playerName}`}
                  sx={{
                    width: 340,
                    pl: 0,
                    pr: 0,
                    display: "block",
                    overflow: "hidden",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(
                      370,
                      measureTextWidth(this.props.deck.name, "Splatoon2") / 1.45
                    ),
                    top: 458,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src="/textures/InkNormal_00.webp"
                      style={{
                        position: "absolute",
                        width: 100,
                        filter: "brightness(0.3)",
                      }}
                    ></img>
                    <span
                      style={{
                        position: "absolute",
                        textAnchor: "middle",
                        color: "#bfbfbf",
                        fontFamily: "Splatoon1",
                        fontSize: "0.9rem",
                        textShadow: "1px 1px black",
                        left: 25,
                        top: 20,
                      }}
                    >
                      {getDeckTotalArea(this.props.deck.deck)}
                    </span>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      );
    };

    const handleCopyLink = async () => {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(this.props.url);
        MessageBar.success(`successfully copied link to clipboard`);
      } else {
        console.log(this.props.url);
        MessageBar.warning(`logged to console since context is not secure`);
      }
    };

    const handleCopyPoster = async () => {
      const renderPoster = async () => {
        const { default: domtoimage } = await import("dom-to-image-more");
        const url = await domtoimage.toPng(rootRef.current);
        if (navigator.clipboard) {
          const data = await fetch(url);
          const blob = await data.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          MessageBar.success(`successfully copied poster to clipboard`);
        } else {
          console.log(url);
          MessageBar.warning(
            `logged data url to console since context is not secure`
          );
        }
      };
      await LoadingDialog.wait({
        task: renderPoster(),
        message: "Rendering poster...",
      });
    };

    return (
      <Dialog open={this.props.open}>
        <Grid container>
          <Grid item>
            <Box>{this.props.deck ? renderContent() : null}</Box>
          </Grid>
          <Grid item sx={{ p: 2 }}>
            <Divider orientation="vertical"></Divider>
          </Grid>
          <Grid item sx={{ position: "relative", flexGrow: 1, width: 400 }}>
            <CardHeader title={"Share Deck"} />
            <Divider sx={{ pt: 2 }} />
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={true}
                      checked={state.portrait}
                      onChange={({ target }) =>
                        setState((state) => ({
                          ...state,
                          portrait: target.checked,
                        }))
                      }
                    />
                  }
                  label="Show portrait"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.dark}
                      onChange={({ target }) =>
                        setState((state) => ({
                          ...state,
                          dark: target.checked,
                        }))
                      }
                    />
                  }
                  label="Use dark background"
                />
              </Grid>
            </Grid>
            <Box
              sx={{
                boxSizing: "border-box",
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                p: 2,
              }}
            >
              <Grid container spacing={2} justifyContent="flex-end">
                <Grid item xs={5}>
                  <SplitButton
                    items={[
                      { text: "Copy Poster", onClick: handleCopyPoster },
                      { text: "Copy Link", onClick: handleCopyLink },
                    ]}
                    defaultItem={0}
                    sx={{ width: "100%" }}
                  >
                    Copy
                  </SplitButton>
                </Grid>
                <Grid item xs={4}>
                  <BasicButton fullWidth onClick={() => this.props.resolve()}>
                    Close
                  </BasicButton>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Dialog>
    );
  }
}

export const DeckShareDialog = new DeckShareDialog_0();
