import {
    Button,
    Card,
    CardActionArea,
    CardContent, Chip,
    IconButton, Stack,
    Tooltip
} from "@mui/material";
import React, {useEffect, useState} from "react";
import {East, Edit, West} from "@mui/icons-material";
import InterceptionConfigurationModal from "./InterceptionConfigurationModal.jsx";
import DeleteIcon from "@mui/icons-material/Delete";
import RuleIndicator from "../feedback/RuleIndicator.jsx";
import TemplateIndicator from "../feedback/TemplateIndicator.jsx";
import JsonView from "react18-json-view";

export default function InterceptionConfigurationCard(
    props
){

    const
    {
        initTopic = "",
        initJsonTemplate= {"state" : "on"},
        initPlainTemplate= "double",
        initJsonRule= {"state" : "off"},
        initPlainRule= "single",
        topicRoot = "",
        initJsonRuleActive=0,
        initJsonTemplateActive=true,
        updateInterception=(item) => {},
        conflictStatus=0,
        conflictMessage="",
        onDeleteClicked=(index)=>{},
        key=`interception-pattern-${Math.floor(Math.random()*100)}`
    } = props;

    const [jsonTemplate, setJsonTemplate] = useState(initJsonTemplate);
    const [plainTemplate, setPlainTemplate] = useState(initPlainTemplate);

    const [jsonRule, setJsonRule] = useState(initJsonRule);
    const [plainRule, setPlainRule] = useState(initPlainRule);

    const [modalOpen, setModalOpen] = useState(false);
    const [topic, setTopic] = useState(initTopic);

    const [jsonRuleActive, setJsonRuleActive ] = useState(initJsonRuleActive);
    const [jsonTemplateActive, setJsonTemplateActive ] = useState(initJsonTemplateActive);

    const commitUpdateHandler = () => {
        console.log('commit update')
        const update = {
            jsonTemplate,
            plainTemplate,
            jsonTemplateActive,
            jsonRule,
            plainRule,
            jsonRuleActive,
            topic,
            conflictStatus,
            conflictMessage
        };
        updateInterception(update);
    }


    useEffect(() => {
        console.log(jsonRuleActive);
        if (jsonRuleActive === 2) {
            setPlainRule("*");
        }

        }, [jsonRuleActive]
    );

    useEffect(() => {
            //if the user did all changes and has closed the modal, the changes are ready for commitment
            if (modalOpen) return;
            commitUpdateHandler();
        }, [modalOpen]
    );

    return (
        <Card
            key={key}
            sx={{
                height: '100%',
                mr: 1, ml:1, mt: 1,
                borderRadius: 2.5,
                width: '90%',
                '&:hover' : {
                    width: '92%',
                    height: '100%',
                    transition: '0.2s'
                }
            }}
        >
            <CardActionArea
                sx={{
                    height: '100%',
                    '&[data-active]': {
                        backgroundColor: 'action.selected',
                        '&:hover': {
                            backgroundColor: 'action.selectedHover',
                        },
                    },
                }}
            >
                <CardContent sx={{ height: '100%' }}>
                    <Stack
                        direction="row"
                        spacing={0.5}
                    >
                        <Stack
                            direction="column"
                            spacing={0.5}
                            sx={{
                                justifyContent: "center",
                                width: 100,
                                maxWidth: 100,
                            }}
                        >
                            <Tooltip title={`Interception for topic: ${topicRoot}${topic}`}>
                                <Chip
                                    label={topic}
                                    size="small"
                                />
                            </Tooltip>

                            <Tooltip title={<span> {conflictMessage} </span>}>
                                <Chip
                                    label={ (conflictStatus === 0) ? "ok" : "interference"}
                                    size="small"
                                    color={ (conflictStatus === 0) ? "success" : "warning"}
                                />
                            </Tooltip>
                        </Stack>
                        <Stack
                            direction="column"
                            sx={{
                                justifyContent: "center",
                                mt: jsonTemplateActive ? 1.5 : 0,
                                width: 70,
                                maxWidth: 70
                            }}
                            spacing={0.5}
                        >

                            <RuleIndicator
                                rule={{json: jsonRule, plain: plainRule}}
                                active={jsonRuleActive}
                            />
                            <TemplateIndicator
                                template={{json: jsonTemplate, plain: plainTemplate}}
                                active={jsonTemplateActive}
                            />
                        </Stack>
                        <Stack
                            direction="column"
                        >
                            <Tooltip title={"Edit this interception pattern"}>
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => {setModalOpen(true)}}
                                >
                                    <Edit sx={{maxWidth:20, maxHeight:20}}/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={"Delete this interception pattern"}>
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={ onDeleteClicked }
                                >
                                    <DeleteIcon sx={{maxWidth:20, maxHeight:20}}/>
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                    {/*/!*Further editing in a modal*!/*/}
                    <InterceptionConfigurationModal
                        topic={topic}
                        setTopic={setTopic}
                        topicRoot={topicRoot}
                        jsonTemplate={jsonTemplate}
                        jsonRule={jsonRule}
                        plainRule={plainRule}
                        plainTemplate={plainTemplate}
                        open={modalOpen}
                        setOpen={setModalOpen}
                        setJsonTemplate={setJsonTemplate}
                        setJsonRule={setJsonRule}
                        setPlainTemplate={setPlainTemplate}
                        setPlainRule={setPlainRule}
                        jsonRuleActive={jsonRuleActive}
                        setJsonRuleActive={setJsonRuleActive}
                        jsonTemplateActive={jsonTemplateActive}
                        setJsonTemplateActive={setJsonTemplateActive}
                    />
                </CardContent>
            </CardActionArea>
        </Card>
    )
}