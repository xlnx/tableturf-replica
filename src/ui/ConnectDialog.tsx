import * as React from "react";
import { ReactComponent } from "../engine/ReactComponent";
import Backdrop from "@mui/material/Backdrop";
import { Box } from "@mui/system";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import { Tabs } from "@mui/material";
import TextField from "@mui/material/TextField";
import { MessageBar } from "./MessageBar";
import { Lobby } from "../Lobby";
import { P2PHost } from "../P2P";
import { MyDialog } from "./Theme";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
          {/* <Typography>{children}</Typography> */}
        </Box>
      )}
    </div>
  );
}

interface P2PTabProps {
  onConnect: () => void;
}

function P2PTab(props: P2PTabProps) {
  const { onConnect } = props;

  const [state, setState] = React.useState({
    overlay: false,
    url: "",
  });

  const connect = async () => {
    setState({ ...state, overlay: true });
    const { url } = state;
    try {
      const peer = new URL(url).searchParams.get("peer");
      if (peer == P2PHost.matchId) {
        throw `cannot connect to yourself`;
      }
      await Lobby.connectP2P(peer, 20);
      MessageBar.success(`connected to peer ${url}`);
      onConnect();
    } catch (err) {
      MessageBar.error(err);
    } finally {
      setState({ ...state, overlay: false });
    }
  };

  const copyInviteUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(P2PHost.url);
      MessageBar.success(`copied to clipboard: ${P2PHost.url}`);
    } else {
      console.log(P2PHost.url);
      MessageBar.warning(`logged to console since context is not secure`);
    }
  };

  return (
    <React.Fragment>
      <Grid container direction="column" height="100%" spacing={3}>
        <Grid item>
          <TextField
            required
            variant="standard"
            label="Peer url"
            onChange={(e) => setState({ ...state, url: e.target.value })}
          />
        </Grid>
        <Grid item>
          <img
            src={P2PHost.qrcode}
            style={{ width: "256px", height: "256px" }}
          ></img>
          {/* <TextField
            required
            variant="standard"
            label="Peer id"
            onChange={(e) => setState({ ...state, id: e.target.value })}
          /> */}
        </Grid>
        <Grid item>
          <Box justifyContent="flex-end" display="flex">
            <Button variant="outlined" onClick={copyInviteUrl}>
              Copy Invite Url
            </Button>
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={state.overlay}
        // onClick={() => setState({ ...state, overlay: false })}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </React.Fragment>
  );
}

function BotTab(props: P2PTabProps) {
  const { onConnect } = props;

  const [state, setState] = React.useState({
    overlay: false,
    url: "",
  });

  const connect = async () => {
    MessageBar.error("unimplemented");
  };

  return (
    <React.Fragment>
      <Grid container direction="column" height="100%" spacing={3}>
        <Grid item>
          <TextField
            required
            variant="standard"
            label="Bot url"
            onChange={(e) => setState({ ...state, url: e.target.value })}
          />
        </Grid>
        <Grid item>
          <Box justifyContent="flex-end" display="flex">
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={state.overlay}
        // onClick={() => setState({ ...state, overlay: false })}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </React.Fragment>
  );
}

function DummyTab(props: P2PTabProps) {
  const { onConnect } = props;

  const [state, setState] = React.useState({
    overlay: false,
  });

  const connect = async () => {
    MessageBar.error("unimplemented");
  };

  return (
    <React.Fragment>
      <Grid container direction="column" height="100%" spacing={3}>
        <Grid item>
          <Box justifyContent="flex-end" display="flex">
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={state.overlay}
        // onClick={() => setState({ ...state, overlay: false })}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </React.Fragment>
  );
}

interface ConnectDialogProps {
  open: boolean;
}

class ConnectDialog_0 extends ReactComponent<ConnectDialogProps> {
  init(): ConnectDialogProps {
    return {
      open: false,
    };
  }

  async connect(): Promise<void> {
    this.update({ open: true });
    // await this.receive("close");
  }

  render(): React.ReactNode {
    const [state, setState] = React.useState({
      tabIndex: 0,
      processing: false,
      botUrl: "",
    });
    const handleClose = () => {
      // this.send("close", []);
      this.update({ open: false });
    };
    const handleConnect = () => {
      // this.send("close", []);
      this.update({ open: false });
    };
    return (
      // <Dialog onClose={handleClose} open={this.props.open}>
      <MyDialog
        onClose={handleClose}
        open={this.props.open}
        sx={{
          width: 600,
        }}
      >
        <DialogTitle>Squid Connect</DialogTitle>
        <Tabs
          value={state.tabIndex}
          onChange={(_, tabIndex) => setState({ ...state, tabIndex })}
        >
          <Tab label="Player"></Tab>
          <Tab label="Bot"></Tab>
          <Tab label="Dummy"></Tab>
        </Tabs>
        <TabPanel value={state.tabIndex} index={0}>
          <P2PTab onConnect={handleConnect}></P2PTab>
        </TabPanel>
        <TabPanel value={state.tabIndex} index={1}>
          <BotTab onConnect={handleConnect}></BotTab>
        </TabPanel>
        <TabPanel value={state.tabIndex} index={2}>
          <DummyTab onConnect={handleConnect}></DummyTab>
        </TabPanel>
      </MyDialog>
    );
  }
}

export const ConnectDialog = new ConnectDialog_0();
