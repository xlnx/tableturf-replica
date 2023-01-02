import { Box, Grid, Paper } from "@mui/material";
import { CardSmall } from "../../components/CardSmall";
import { ReactComponent } from "../../../engine/ReactComponent";
import { StarterDeck } from "../../../Game";

interface DeckPanelProps {
  invalidateCards: number[];
  selectedCard: number;
  deck: number[];
}

class DeckPanel_0 extends ReactComponent<DeckPanelProps> {
  init(): DeckPanelProps {
    return {
      invalidateCards: [],
      selectedCard: -1,
      deck: StarterDeck.slice(),
    };
  }

  render() {
    return (
      <Paper
        sx={{
          position: "absolute",
          width: 480,
          height: 940,
          left: 30,
          top: 100,
          p: 3,
          boxSizing: "border-box",
          boxShadow: "5px 5px 2px rgba(0, 0, 0, 0.3)",
        }}
      >
        <Box sx={{ width: "100%", height: "100%" }}>
          <Grid
            container
            sx={{ width: "100%", height: "100%", overflow: "hidden" }}
          >
            {this.props.deck.map((card) => (
              <Grid item xs={4} key={card}>
                <Box sx={{ p: 1 }}>
                  <CardSmall
                    width={125}
                    card={card}
                    active={this.props.invalidateCards.indexOf(card) < 0}
                    selected={this.props.selectedCard == card}
                    // onClick={() => this.selectCard(card)}
                  ></CardSmall>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    );
  }
}

export const DeckPanel = new DeckPanel_0();
