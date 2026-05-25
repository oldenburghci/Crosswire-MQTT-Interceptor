import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server:{
    https: true,
    host: true,
    port: 3000,
    open: true,
    proxy: {
      "^/api" : {
        target: 'https://localhost:9000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(path);
          return path;
        }
      },
      //mockup object for network because scanning is expensive
      "/middleware/api/network" : {
        // happy case
        // target: "https://localhost:3000/src/assets/mockup/network/network.json",
        // not so happy case
        target: "https://localhost:3000/src/assets/mockup/network/incorrect_network.json",
        secure: false,
        rewrite: (path) => {
          const now = new Date().getTime();
          console.log("Mock delay of network scan ...")
          while(new Date().getTime() < now + 500) {}
          console.log("...Scan is done");
          console.log(path);
          return "";
        }
      },
      // proxy towards the backend
      "^/middleware/api/" : {
        target: "https://localhost:9000",
        changeOrigin: true,
        secure: false,
        rewrite (path) {
          console.log(path);
          return path;
        }
      },
      "^/auth/" : {
        target: "https://localhost:9000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(path);
          return path;
        }
      },
      "/login" : {
        target: "https://localhost:9000",
        changeOrigin: true,
        secure: false,
        rewrite (path) {
          console.log(path);
          return path;
        }
      }
    }
  }
})
