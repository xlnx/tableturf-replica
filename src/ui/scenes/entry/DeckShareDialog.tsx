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
  FormControlLabel,
} from "@mui/material";
import { System } from "../../../engine/System";
import { renderQrCode } from "../../../engine/QrCode";
import { CardSmall } from "../../components/CardSmall";
import { BasicButton } from "../../Theme";
import { DB } from "../../../Database";
import { LoadingDialog } from "../../components/LoadingDialog";
import { MessageBar } from "../../components/MessageBar";

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

  async prompt(deck: IDeckData): Promise<void> {
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
      if (!this.props.url) {
        return;
      }
      renderQrCode(this.props.url, {
        margin: 2,
        color: {
          light: "#0f0f0f",
          dark: "#efefef",
        },
      }).then((qrcode) => this.update({ qrcode }));
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
          }}
        >
          <Grid container sx={{ width: "100%", height: "100%" }}>
            <Grid item container xs={12} sx={{ height: 400 }}>
              {cards}
            </Grid>
            <Grid
              item
              container
              alignItems="flex-end"
              xs={12}
              sx={{ flexGrow: 1, p: 1, pb: 0 }}
            >
              <Grid item xs={8}>
                <CardHeader
                  title={this.props.deck.name}
                  subheader={`by: ${DB.read().playerName}`}
                />
              </Grid>
              <Grid
                item
                container
                alignItems="flex-end"
                justifyContent="flex-end"
                xs={4}
              >
                <Grid item>
                  <img
                    src={this.props.qrcode}
                    style={{ width: 130, height: 130 }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      );
    };

    const handleShare = async () => {
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
          <Grid item sx={{ flexGrow: 1, width: 500 }}>
            <CardHeader title={"Share Deck Poster"} />
            <Divider sx={{ pt: 2 }} />
            <Grid
              container
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 2 }}
            >
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      disabled={true}
                      checked={state.portrait}
                      onChange={({ target }) =>
                        setState({ ...state, portrait: target.checked })
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
                        setState({ ...state, dark: target.checked })
                      }
                    />
                  }
                  label="Use dark background"
                />
              </Grid>
              <Grid item xs={4}>
                <BasicButton fullWidth onClick={handleShare}>
                  Share
                </BasicButton>
              </Grid>
              <Grid item xs={4}>
                <BasicButton fullWidth onClick={() => this.props.resolve()}>
                  Close
                </BasicButton>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Dialog>
    );
  }
}

export const DeckShareDialog = new DeckShareDialog_0();
