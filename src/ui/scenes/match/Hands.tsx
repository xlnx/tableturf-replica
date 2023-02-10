import { Box, Grid } from "@mui/material";
import { ReactComponent } from "../../../engine/ReactComponent";
import { CardSmall } from "../../components/CardSmall";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface HandsProps {
  enabled: boolean;
  cards: number[];
  mask: boolean[];
  selected: number;
  // layout
  player: IPlayerId;
  spacing: number;
  xs: number;
  wi: number;
}

export class Hands extends ReactComponent<HandsProps> {
  private cardsRef;

  init(): HandsProps {
    return {
      enabled: true,
      cards: [],
      mask: Array(4).fill(true),
      selected: -1,
      // layout
      player: 0,
      spacing: 2,
      xs: 6,
      wi: 235,
    };
  }

  async uiUpdate(newCards: number[]) {
    const idxs = newCards.flatMap((cardId, i) => (cardId == null ? [] : [i]));
    await Promise.all(
      idxs.map((idx) =>
        gsap.to(this.cardsRef.current[idx], {
          duration: 0.3,
          scale: 0.9,
          opacity: 0,
        })
      )
    );

    const cards = this.props.cards.slice();
    newCards.forEach((cardId, i) => {
      if (cardId != null) {
        cards[i] = cardId;
      }
    });
    await this.update({ cards });

    await Promise.all(
      idxs.map((idx) =>
        gsap.to(this.cardsRef.current[idx], {
          duration: 0.3,
          scale: 1,
          opacity: 1,
        })
      )
    );
  }

  render() {
    this.cardsRef = useRef([]);
    useEffect(() => {
      this.dispatchEvent("selected-change", this.props.selected);
    }, [this.props.selected]);

    const li = [];
    for (let i = 0; i < 4; ++i) {
      const card = this.props.cards[i];
      li.push(
        <Grid item xs={this.props.xs} key={i}>
          <Box
            sx={{
              width: this.props.wi,
              height: (this.props.wi * 196) / 153,
            }}
            ref={(el) => (this.cardsRef.current[i] = el)}
          >
            <div
              style={{
                transformOrigin: "top left",
                transform: `scale(${this.props.wi / 153})`,
              }}
            >
              <CardSmall
                player={this.props.player}
                card={card || 1}
                // width={this.props.wi}
                active={this.props.mask[i] && this.props.enabled}
                selected={this.props.selected == i}
                onClick={() => {
                  this.dispatchEvent("click", i);
                  if (this.props.selected != i) {
                    this.update({ selected: i });
                  }
                }}
              />
            </div>
          </Box>
        </Grid>
      );
    }

    return (
      <Grid container spacing={this.props.spacing}>
        {li}
      </Grid>
    );
  }
}
