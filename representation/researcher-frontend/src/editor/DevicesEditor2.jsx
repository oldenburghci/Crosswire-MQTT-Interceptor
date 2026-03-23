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

    // const [loading, setLoading] = useState(true);
    //
    // useEffect(()=>{
    //     //gives the impression of data processing
    //     setLoading(true);
    //     setTimeout(() => {
    //         setLoading(false);
    //     }, 1500);
    // }, [lights]);

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