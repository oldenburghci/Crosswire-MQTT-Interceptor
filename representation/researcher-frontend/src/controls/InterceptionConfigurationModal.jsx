import {Box, Button, Divider, Grid2, InputAdornment, Modal, Stack, TextField, Tooltip} from "@mui/material";
import {East, West} from "@mui/icons-material";
import JsonView from "react18-json-view";
// import '../editor/EntityConfigurationEditor.css';
import React, {useEffect, useState} from "react";
import modalStyles from "../items/ModalStyles.jsx";
const myModalStyles = { ...modalStyles, width: '80%', maxWidth: 600 };

export default function InterceptionConfigurationModal({
    jsonRule,
    setJsonRule = (event) => {},
    plainRule,
    setPlainRule = (event) => {},
    jsonTemplate,
    setJsonTemplate = (event) => {},
    plainTemplate,
    setPlainTemplate = (event) => {},
    open=false,
    setOpen=(open) => {},
    jsonRuleActive=0,
    setJsonRuleActive = (flag) => {},
    jsonTemplateActive=true,
    setJsonTemplateActive = (flag) => {},
    topicRoot="some/root/topic/",
    topic="leaf",
    setTopic = (event) => {},
}) {

    const [internalTopic, setInternalTopic] = useState(topic);
    const [internalPlainTemplate, setInternalPlainTemplate] = useState(plainTemplate);
    const [internalPlainRule, setInternalPlainRule] = useState(plainRule);

    const onJsonRuleClicked = () => {
        setJsonRuleActive(0);
    }

    const onPlainRuleClicked = () => {
        setJsonRuleActive(1);
    }

    const onAllRuleClicked = () => {
        setJsonRuleActive(2);
    }

    const onJsonTemplateClicked = () => {
        setJsonTemplateActive(true);
    }

    const onPlainTemplateClicked = () => {
        setJsonTemplateActive(false);
    }
    //from https://medium.com/@rushikeshsp25/react-js-the-best-way-to-handle-the-onchange-event-on-textarea-927fc7cdf816
    const debounce = (func, delay) => {
        let debounceTimer;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer =
                setTimeout(() => func.apply(context, args), delay);
        }
    }

    const handleChange = (event) => {
        event.persist();
        // console.log("Something is changed in the textarea");
        setTopic(() => event.target.value);
    }

    const handlePlainTemplateChange = (event) => {
        event.persist();
        setPlainTemplate(()=>event.target.value);
    }

    // const optimisedHandleChange = debounce(handleChange,1000);
    // const optimisedHandlePlainTemplateChange = debounce(handlePlainTemplateChange, 1000);

    return (
        <Modal
        open={open}
        onClose={()=> {
            setTopic(internalTopic);
            setPlainTemplate(internalPlainTemplate);
            setPlainRule(internalPlainRule);
            setOpen(false);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
    >
        <Box sx={myModalStyles} className={"modal-box"}>
            <Box sx={{m:1}}>
                <Grid2
                    sx={{mb:1}}
                    rowSpacing={2}
                    container
                >
                    <Grid2 size={12} >
                        <TextField
                            label={"Topic to intercept"}
                            size="small"
                            value={internalTopic}
                            variant="outlined"
                            slotProps={{
                                input: {
                                    startAdornment: <InputAdornment position={"start"}>{topicRoot}</InputAdornment>
                                }
                            }}
                            onChange={(event) => {
                                setInternalTopic(event.target.value);
                                optimisedHandleChange(event, 500);
                            }}
                        />

                    </Grid2>
                    {/*Rule*/}
                    <Grid2 size={8}>
                        <Stack spacing={1} direction="row" >
                            <Tooltip title={"This is the pattern the engine will check incoming messages against."}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"

                                >
                                    <East/>
                                </Button>
                            </Tooltip>
                            { (jsonRuleActive === 0 ) &&(
                                <JsonView
                                    src={jsonRule}
                                    editable={true}
                                    onChange={(event) => setJsonRule(event.src)}
                                />
                            )}
                            { (jsonRuleActive === (1 || 2)) && (
                                <TextField
                                    color="grey.500"
                                    // label={"Plain Template"}
                                    size="small"
                                    variant="standard"
                                    focused
                                    value={internalPlainRule}
                                    sx={{pr:5}}
                                    onChange={(event)=> {
                                        setInternalPlainRule(event.target.value);
                                        // optimisedHandleChange(event, 500);
                                    }}
                                    disabled={ (jsonRuleActive === 2) }
                                />
                            ) }
                        </Stack>
                    </Grid2>
                    <Grid2 size={1}/>
                    <Grid2 size={2}>
                        <Stack
                            direction="row"
                            sx={{
                                justifyContent: "center",
                                mt: (jsonRuleActive===0) ? 1.5 : 0,
                                // maxWidth: 20,
                        }}
                        >
                            <Tooltip title={"Use a json as rule"}>
                                <Button
                                    variant={ (jsonRuleActive === 0) ? "contained" : "outlined" }
                                    size="small"
                                    sx={{
                                        borderRadius: '10px 0 0 10px',
                                        maxHeight: 50
                                    }}
                                    onClick={()=> onJsonRuleClicked() }
                                >
                                    Json
                                </Button>
                            </Tooltip>
                            <Tooltip title={"Use a plain text as rule"}>
                                <Button
                                    variant={ (jsonRuleActive === 1) ? "contained" : "outlined" }
                                    size="small"
                                    sx={{
                                        borderRadius: '0 0 0 0',
                                        maxHeight: 50
                                    }}
                                    onClick={()=> onPlainRuleClicked()}
                                >
                                    Plain
                                </Button>
                            </Tooltip>
                            <Tooltip title={"Intercept all incoming message."}>
                                <Button
                                    variant={ (jsonRuleActive === 2) ? "contained" : "outlined" }
                                    size="small"
                                    sx={{
                                        borderRadius: '0 10px 10px 0',
                                        maxHeight: 50
                                    }}
                                    onClick={()=> onAllRuleClicked()}
                                >
                                    All
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Grid2>
                    {/*Template*/}
                    <Grid2 size={8}>
                        <Stack
                            sx={{mb:1}}
                            direction="row"
                            spacing={1}
                        >
                            <Tooltip title={"If the pattern is matched by a message, substitute the original with this message."}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="secondary"
                                >
                                    <West/>
                                </Button>
                            </Tooltip>
                            {(jsonTemplateActive) && (
                                <JsonView
                                    theme={"a11y"}
                                    src={jsonTemplate}
                                    editable={true}
                                    onChange={(event) => setJsonTemplate(() => event.src)}
                                />
                            )}
                            { !jsonTemplateActive && (
                                <TextField
                                    color="grey.500"
                                    sx={{pr:3}}
                                    size="small"
                                    variant="standard"
                                    focused
                                    value={internalPlainTemplate}
                                    onChange={(event)=>{
                                        // console.log(event);
                                        setInternalPlainTemplate(event.target.value);
                                        // optimisedHandlePlainTemplateChange(event, 500);
                                    } }
                                />
                            )}
                        </Stack>
                    </Grid2>
                    <Grid2 size={1}/>
                    <Grid2 size={2}>
                        <Stack
                            direction="row"
                            sx={{
                                justifyContent: "center",
                                mt: jsonTemplateActive ? 1.5 : 0
                            }}
                        >
                            <Tooltip title={"Use a json as template"} >
                                <Button
                                    variant={(!jsonTemplateActive) ? "outlined" : "contained"}
                                    size="small"
                                    sx={{
                                        borderRadius: '10px 0 0 10px',
                                        maxHeight: 50
                                    }}
                                    onClick={()=> { onJsonTemplateClicked() }}
                                >
                                    Json
                                </Button>
                            </Tooltip>
                            <Tooltip title={"Use a plain text as template"}>
                                <Button
                                    variant={(jsonTemplateActive) ? "outlined" : "contained"}
                                    size="small"
                                    sx={{
                                        borderRadius: '0 10px 10px 0',
                                        maxHeight: 50
                                    }}
                                    onClick={()=>{ onPlainTemplateClicked() }}
                                >
                                    Plain
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Grid2>
                </Grid2>
            </Box>
        </Box>
    </Modal>)
}