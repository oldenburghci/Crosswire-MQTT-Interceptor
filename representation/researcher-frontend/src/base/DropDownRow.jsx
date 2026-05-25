import {FormControl, MenuItem, Select, TableCell, TableRow, Typography} from "@mui/material";
import {useState} from "react";


export default function DropDownRow(props={
    originalRule: 'Rule X',
    options: [
        'Rule Y_0',
        'Rule Y_1',
        'Rule Y_2',
        'Rule Y_3'
    ]
}) {
    const [ originalRule, setOriginalRule ] = useState(props.originalRule);
    const [ substitutionRule, setSubstitutionRule ] = useState(props.options[0]);

    const [ options, setOptions ] = useState(
        props.options
    );

    const handleChange = (event) => {
        setSubstitutionRule(event.target.value);
    }


    return <TableRow>
        <TableCell colSpan={6} align={"center"}>
            <FormControl variant={"standard"} sx={{ m: 1, minWidth: 120}}>
                <Typography>{originalRule}</Typography>
            </FormControl>
        </TableCell>
        <TableCell colSpan={6} align={"center"}>
            <FormControl variant={"standard"} sx={{ m: 1, minWidth: 120}} size={"small"}>
                <Select
                    value={ substitutionRule }
                    onChange={ handleChange }
                    label={"Substitution Rule"}
                >
                    {
                        options.map((option) => {
                            return (
                                <MenuItem key={option} value={option}>
                                    <Typography>{option}</Typography>
                                </MenuItem>
                            )
                        })
                    }
                </Select>
            </FormControl>
        </TableCell>
    </TableRow>
}