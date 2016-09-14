/**
 * @apiDefine Token API Token Authentication
 *  API token must be included either as an HTTP `Bearer: your-token` header or as a query
 *  parameter `?access_token=your-token`
 *  [Request a token](https://github.com/hotosm/oam-uploader).
 */

/**
 * @apiDefine uploadStatusSuccess
 * @apiSuccess {Object} results.uploader Uploader contact info
 * @apiSuccess {String} results.uploader.name
 * @apiSuccess {String} results.uploader.email
 * @apiSuccess {Object[]} results.scenes
 * @apiSuccess {Object} results.scenes.contact Contact person for this scene
 * @apiSuccess {String} results.scenes.contact.name
 * @apiSuccess {String} results.scenes.contact.email
 * @apiSuccess {String} results.scenes.title Scene title
 * @apiSuccess {String="satellite","aircraft","UAV","balloon","kite"} results.scenes.platform
 * @apiSuccess {String} results.scenes.provider Imagery provider
 * @apiSuccess {String} results.scenes.sensor Sensor/device
 * @apiSuccess {String} results.scenes.acquisition_start Date and time of imagery acquisition
 * @apiSuccess {String} results.scenes.acquisition_end Date and time of imagery acquisition
 * @apiSuccess {Object[]} results.scenes.images Array of images in this scene
 * @apiSuccess {String} results.scenes.images.url
 * @apiSuccess {String="initial","processing","finished","errored"} results.scenes.images.status
 * @apiSuccess {String} results.scenes.images.error
 * @apiSuccess {String[]} results.scenes.images.messages
 * @apiSuccess {String} results.scenes.images.startedAt Date and time the processing started
 * @apiSuccess {String} results.scenes.images.stoppedAt Date and time the processing stopped
 */
