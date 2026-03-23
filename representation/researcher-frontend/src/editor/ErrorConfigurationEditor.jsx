import {
    Button,
    Grid2,
    CircularProgress,
    Paper, Typography, Stack
} from "@mui/material";
import ErrorIcon from '@mui/icons-material/Error';
import {useEffect, useMemo,  useState} from "react";
import {SigmaContainer} from "@react-sigma/core";
import '@react-sigma/core/lib/style.css';
// overwrite styles for positioning
import '../cg/sigma.css'

import {createNodeImageProgram} from "@sigma/node-image";
import {drawHover} from "../cg/misc.jsx";
import GraphInstance from "../cg/GraphInstance.jsx";

import {createNodeCompoundProgram} from "sigma/rendering";
import {createNodeBorderProgram} from "@sigma/node-border";
import ErrorInjectionControl from "../controls/ErrorInjectionControl.jsx";

const sigmaStyle = {
    width: "800px",
    height: "600px",
    borderRadius: "16px",
    background: "#272727",
};

export default function ErrorConfigurationEditor(
    {
        activeConfiguration = "",
        suppressedTopicsMap = new Map(),
        setSuppressedTopicsMap = (map) => {},
        interceptedTopicsMap = new Map(),
        setInterceptedTopicsMap = (map) => {},
        onUpdate=()=>{},
        scanRequested = false,
        setScanRequested = (state) => {},
        nodes=[],
        edges=[],
        requestNetworkScan=()=>{}
    }
) {
    console.log(scanRequested, nodes, edges);
    const [selectedNode, setSelectedNode] = useState(null);
    const updateTopics = (suppressed, intercepted) => {
        setInterceptedTopicsMap(()=>intercepted);
        setSuppressedTopicsMap(()=>suppressed);
        onUpdate()
    }

    // --- Effects ---
    useEffect(() => {
        setSelectedNode(()=>null);
    }, [activeConfiguration]);
    // --- Memos ---
    const{ NodeProgram } = useMemo(()=>{
        const NodeCustomImageProgram = createNodeImageProgram({
            padding: 0.3,
            drawingMode: "background",
            size: { mode: "force", value: 256 },
            colorAttribute: "color"
        });

        const NodeCustomBorderProgram = createNodeBorderProgram({
            borders: [
                { size: { value: 0.1 }, color: { attribute: "borderColor" }},
            ],
        });

        const NodeProgram = createNodeCompoundProgram([   NodeCustomImageProgram, NodeCustomBorderProgram ]);
        return { NodeProgram: NodeProgram }
    },[]);

    return <>
        <Grid2 container spacing={1}>
            <Grid2 size={9}>
                <Paper
                    elevation={4}
                    sx={{
                        borderRadius: 4,
                        minWidth: 700,
                        minHeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                }}
                >
                    {
                        (scanRequested===null) && (
                            <Stack
                                gap
                            >
                                {
                                    // user feedback in error case
                                    (!nodes && !edges) && <Stack
                                        direction="row"
                                        gap
                                    >
                                        <ErrorIcon
                                            color="warning"
                                        />
                                        <Typography>
                                        An error occurred during the network scan.
                                        </Typography>
                                        <ErrorIcon
                                            color="warning"
                                        />
                                    </Stack>
                                }
                                {
                                    //initialize scan button
                                    <Stack
                                        sx={{
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Button
                                            onClick={() => {
                                                requestNetworkScan();
                                            }}
                                            color="primary"
                                            variant="outlined"
                                            sx={{mb: 2}}
                                        >
                                            Initiate Network Scan
                                        </Button>
                                    </Stack>
                                }
                            </Stack>
                        )
                    }
                    {
                        //progress feedback
                        (scanRequested) && <CircularProgress sx={{m:3}}/>
                    }
                    {
                        //happy case
                        (scanRequested === false && nodes.length >= 1 && edges.length >= 0) && <SigmaContainer style={sigmaStyle} settings={
                            {
                                allowInvalidContainer: true,
                                defaultNodeType: 'image',
                                nodeProgramClasses: {
                                    image: NodeProgram,
                                },
                                labelColor: { color: "#f4e3e3"},
                                defaultDrawNodeHover: drawHover,
                            }
                        }>
                            <GraphInstance nodes={nodes} edges={edges} setSelectedNode={setSelectedNode}/>
                        </SigmaContainer>
                    }

                </Paper>

            </Grid2>
            <Grid2 size={3}>
                <Button
                    onClick={()=>{
                        requestNetworkScan();
                    }}
                    color="primary"
                    variant="outlined"
                    disabled={(scanRequested === null) ? false : scanRequested }
                    sx={{mb:2}}
                >
                    { (scanRequested===null) ? "Initiate Network Scan" : "Rescan Network"}
                </Button>
                {
                    <ErrorInjectionControl
                        deviceId={(selectedNode !== null) ? selectedNode.id : -1}
                        deviceName={(selectedNode !== null) ? selectedNode.label : "No Device Selected"}
                        mqttTopicRoot={(selectedNode !== null) ? selectedNode.topic: "<no-topic-detected>"}
                        suppressedTopicsMap={suppressedTopicsMap}
                        interceptedTopicsMap={interceptedTopicsMap}
                        updateTopicMaps={updateTopics}
                    />
                }
            </Grid2>
        </Grid2>
    </>
}

