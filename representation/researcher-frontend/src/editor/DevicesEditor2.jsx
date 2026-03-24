import {Box, CircularProgress, Grid2} from "@mui/material";
import LightsEditor from "./LightsEditor.jsx";
import {createLightItem} from "../factories/LightItemFactory.js";
import {useEffect, useMemo, useState} from "react";
import SwitchEditor from "./SwitchEditor.jsx";

export default function DevicesEditor2({
    loading=false,
    entities=new Map(),
    onUpdate=(entities, domain)=>{}
}){

    return (
        <Grid2 container size={12} sx={{}} spacing={2}>
            {/* Lights  */}
            <Grid2 size={12}>
                {
                    (!loading) ?
                    <LightsEditor
                        initItems={entities}
                        onUpdate={
                            (update)=> {
                                onUpdate(update, "light")
                            }
                        }
                    />: <CircularProgress color={"primary"}/>
                }
            </Grid2>
            <Grid2 size={12}>
                {(!loading) ? (
                    <SwitchEditor
                        initItems={entities}
                        onUpdate={
                            (update)=> {
                                onUpdate(update, "switch")
                            }
                        }
                    />) : <CircularProgress color={"primary"}/>}
            </Grid2>
        </Grid2>
    )
}