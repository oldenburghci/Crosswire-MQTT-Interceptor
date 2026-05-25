import {GridToolbarContainer, GridToolbarDensitySelector, GridToolbarFilterButton} from "@mui/x-data-grid";
import ToggleSwitch from "../base/ToggleSwitch.jsx";

export default function EditorToolbar(slotProps) {

    return <GridToolbarContainer>
        <GridToolbarDensitySelector/>
        <GridToolbarFilterButton/>
        <ToggleSwitch
            label={'Apply Pre-Filter'}
            state={slotProps.applyFilter}
            updateFx={slotProps.filterChanged}
            tooltip={slotProps.tooltip}
        />
    </GridToolbarContainer>
}