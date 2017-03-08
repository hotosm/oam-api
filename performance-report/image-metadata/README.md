# Open Aerial Map Performance Testing:  Creating Fake Image Metadata

The `make-image-metadata.js` generates an arbitrary number of `.json` files that can be used to simulate additional imagery in the OAM Catalog database. To use:

1. Make sure `oam-test-data.json` is in the same folder as  `make-image-metadata.js`.
2. Run `npm install` to get the dependencies required.
3. Change the `desired` variable to be the number of images files to create.
4. Run `make-image-metadata.js`

Image `.json` files are written to a folder named `image-info`.