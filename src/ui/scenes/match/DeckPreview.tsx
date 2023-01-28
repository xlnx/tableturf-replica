import "./DeckPreview.less";

import { Box, Grid, Paper } from "@mui/material";
import { CardSmall } from "../../components/CardSmall";
import { BasicButton } from "../../Theme";
import { ReactComponent } from "../../../engine/ReactComponent";

interface DeckPreviewProps {
  player: IPlayerId;
  open: boolean;
  deck: number[];
  done: number[];
}

export class DeckPreview extends ReactComponent<DeckPreviewProps> {
  init() {
    return {
      player: 0,
      open: false,
      deck: [],
      done: [],
    };
  }

  render() {
    return (
      <Box
        className={
          `deck-preview-${this.props.player} ` +
          (this.props.open ? "deck-preview-open" : "deck-preview-closed")
        }
      >
        <Paper
          sx={{
            position: "relative",
            p: 4,
            width: 580,
            height: 832,
            top: 125,
            boxSizing: "border-box",
            boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            {this.props.deck.map((id) => (
              <Grid item xs={3} key={id}>
                <CardSmall
                  width={122}
                  card={id}
                  active={this.props.done.indexOf(id) < 0}
                />
              </Grid>
            ))}
          </Grid>
          <Box
            sx={{
              p: 4,
              boxSizing: "border-box",
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
            }}
          >
            <BasicButton fullWidth onClick={() => this.update({ open: false })}>
              Dismiss
            </BasicButton>
          </Box>
        </Paper>
      </Box>
    );
  }
}
