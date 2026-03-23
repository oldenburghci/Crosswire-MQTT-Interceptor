import {subscribeWithSelector} from "zustand/middleware";
import {createStore} from "zustand";

const useApplicationStore = createStore()(
    subscribeWithSelector((set) => (
            {
                reloadConfigurations: false,
                triggerReloadConfigurations: () => {
                    console.log('reload')
                    set({reloadConfigurations: !useApplicationStore.getState().reloadConfigurations});

                },
                lastConfiguration: localStorage.getItem('lastConfiguration') || '',
                setLastConfiguration: (item)=>{
                    // set({lastConfiguration: item});
                    localStorage.setItem('lastConfiguration', item);
                },
                lastMenu: parseInt(localStorage.getItem('lastMenu')) || 0,
                setLastMenu: (item)=>{
                    localStorage.setItem('lastMenu', item);
                },
                lastActiveStep: parseInt(localStorage.getItem('lastActiveStep')) || 0,
                setLastActiveStep: (item)=>{
                    localStorage.setItem('lastActiveStep', item);
                }
            }
        )
    )
)

export default useApplicationStore;