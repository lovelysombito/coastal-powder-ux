import { API_BASE_URL } from '../constants'
import axios from 'axios'

export const register = (data) => axios.post(`${API_BASE_URL}/auth/register`, data)
export const login = (data) => axios.post(`${API_BASE_URL}/auth/login`, data)
export const logout = () => axios.post(`${API_BASE_URL}/auth/logout`)
export const verify = (data) => axios.post(`${API_BASE_URL}/auth/verify`, data)

/** USERS */
export const deleteUser = (data) => axios.delete(`${API_BASE_URL}/users/` + data)
export const updateUser = (data, userId) => axios.put(`${API_BASE_URL}/users/` + userId, data)
export const addUser = (data) => axios.post(`${API_BASE_URL}/users/`, data)
export const getUsers = () => axios.get(`${API_BASE_URL}/users/`)
export const getUser = () => axios.get(`${API_BASE_URL}/user/`)

/** USER NOTIFICATION **/
export const getUserNotificationOptions = () => axios.get(`${API_BASE_URL}/user/notification-options`)
export const updateUserNotificationOptions = (data, userId) => axios.patch(`${API_BASE_URL}/user/notification-options/` + userId, data)

/** USER PASSWORD**/
export const getUserPassword = () => axios.get(`${API_BASE_URL}/user/password`)
export const updateUserPassword = (data) => axios.patch(`${API_BASE_URL}/user/password`, data)

/** TWO FACTOR AUTHENTICATION **/
export const get2faAuth = () => axios.get(`${API_BASE_URL}/user/2factor-auth`)
export const getTwoFactorQRCode = (data) => axios.get(`${API_BASE_URL}/auth/two-factor-qr-code`, data)
export const enableTwoFactorAuth = () => axios.post(`${API_BASE_URL}/auth/two-factor-authentication`)
export const confirmPassword = (data) => axios.post(`${API_BASE_URL}/auth/confirm-password`, data)
export const getRecoveryCodes = () => axios.get(`${API_BASE_URL}/auth/two-factor-recovery-codes`)
export const submitQRCode = (data) => axios.post(`${API_BASE_URL}/auth/confirmed-two-factor-authentication`, data)
export const disableTwoFactorAuth = () => axios.delete(`${API_BASE_URL}/auth/two-factor-authentication`)

/** PRODUCTS */
export const deleteProduct = (data) => axios.delete(`${API_BASE_URL}/products/product/` + data)
export const updateProduct = (data, productId) => axios.patch(`${API_BASE_URL}/products/product/` + productId, data)
export const addProduct = (data) => axios.post(`${API_BASE_URL}/products/product`, data)
export const importProducts = (data, header) => axios.post(`${API_BASE_URL}/products/import`, data, { header })
export const exportProducts = () => axios.post(`${API_BASE_URL}/products/export`)
export const getProductSearch = (keyword) => axios.get(`${API_BASE_URL}/products/search?search=${keyword}`)


/** Colour */
export const getAllColours = () => axios.get(`${API_BASE_URL}/colours`)
export const updateColour = (data, colourId) => axios.patch(`${API_BASE_URL}/colour/` + colourId, data)
export const addColour = (data) => axios.post(`${API_BASE_URL}/colour`, data)
export const deleteColour = (data) => axios.delete(`${API_BASE_URL}/colour/` + data)
export const updatePowderColourInventory = (data, colourId) => axios.patch(`${API_BASE_URL}/colour/change-weight/${colourId}` , data)

/** Jobs  */
export const getDashboard = (query) => axios.get(`${API_BASE_URL}/jobs/dashboard`, { params: query })
export const getOverview = (query) => axios.get(`${API_BASE_URL}/jobs/overview`, { params: query })
export const getJobsBay = (query) => axios.get(`${API_BASE_URL}/jobs/bay`, {params: query})

export const jobLabel = (jobId) => axios.get(`${API_BASE_URL}/jobs/generate-qr-code-labels/${jobId}`, { responseType: 'blob' })
export const getJobRedirect = (jobId) => axios.get(`${API_BASE_URL}/jobs/redirect/${jobId}`);
export const editJob = (data, jobId) => axios.patch(`${API_BASE_URL}/jobs/job/${jobId}/edit`, data);

export const updateJobs = (data, id) => axios.patch(`${API_BASE_URL}/jobs/job/` + id, data)
export const updateBayJobStatus = (data, id) => axios.patch(`${API_BASE_URL}/jobs/job-status/` + id, data)
export const updateBayJobPriority = (data, id) => axios.patch(`${API_BASE_URL}/jobs/job-priority/` + id, data)
export const updateBayJobDate = (data, id) => axios.patch(`${API_BASE_URL}/jobs/job-date/` + id, data)
export const updateJobLocation = (data, id) => axios.patch(`${API_BASE_URL}/job/location/` + id, data)

/** Dispatch */

export const updateJobDispatch = (data, jobId, header) => axios.post(`${API_BASE_URL}/dispatch/job/` + jobId, data, { header })
export const updateLineDispatch = (data, jobId, header) => axios.post(`${API_BASE_URL}/dispatch/line/` + jobId, data, { header })
export const printDealPackingSlip = (data, dealId, header) => axios.post(`${API_BASE_URL}/dispatch/deal/` + dealId + '/packing-slip/print', data, { header, responseType: 'blob' })
export const senEmailDealPackingSlip = (data, dealId, header) => axios.post(`${API_BASE_URL}/dispatch/deal/` + dealId + '/packing-slip/email', data, { header })
export const senDispatchEmailPackingSlip = (data, dealId, header) => axios.post(`${API_BASE_URL}/dispatch/deal/` + dealId + '/dispatch-packing-slip/email', data, { header })

export const updateBulkLineDispatch = (data, header) => axios.post(`${API_BASE_URL}/dispatch/bulk/line/`, data, { header })


/* Hubspot Integration */
export const getAllIntegration = () => axios.get(`${API_BASE_URL}/integrations/`)
export const hubspotCallback = (data) => axios.post(`${API_BASE_URL}/integrations/hubspot/callback`, data)

/* Xero Intergration */
export const xeroCallback = (data) => axios.post(`${API_BASE_URL}/integrations/xero/callback`, data)

/** Update Line */
export const updateLineStatus = (data, id) => axios.patch(`${API_BASE_URL}/line/` + id, data)
export const updateBayLineStatus = (data, id) => axios.patch(`${API_BASE_URL}/line/` + id, data)

/** QUALITY CONTROL */
export const updateQCJob = (data, id, header) => axios.post(`${API_BASE_URL}/qc/job/` + id, data, { header })
export const getPassedQcJobs = () => axios.get(`${API_BASE_URL}/qc/passed`)
export const downloadImage = (data, id, header) => axios.post(`${API_BASE_URL}/ncr/${id}`, data ,{ header, responseType: 'blob' })
export const overrideQCJob = (data, id) => axios.patch(`${API_BASE_URL}/override-qc/${id}`, data)


/** NOTIFICATION */
export const getCommentNotificatioData = () => axios.get(`${API_BASE_URL}/comments/notification/`)
export const patchCommentNotificationRead = (comment_id) => axios.patch(`${API_BASE_URL}/comments/read/` + comment_id)
export const getCommentNotifications = () => axios.get(`${API_BASE_URL}/notifications/get-comment-notifications/`)
export const getCommentNotification = (id) => axios.get(`${API_BASE_URL}/notifications/get-comment-notification/` + id)
export const patchViewedNotification = (id) => axios.patch(`${API_BASE_URL}/notifications/patch-viewed-notification/` + id)



/** POWDER BAY */
export const updatePowderBayForJob = (data, id) => axios.patch(`${API_BASE_URL}/jobs/job/` + id, data)

/** COMMENTS */ 
export const addComment = (data) => axios.post(`${API_BASE_URL}/comments/`, data)
export const getAllComments = () => axios.get(`${API_BASE_URL}/comments/get-all-comments`)

/** SEARCH BAR */
export const getSearchResult = (keyword) => axios.get(`${API_BASE_URL}/search?search=${keyword}`)

/** ARCHIVE */
export const downloadArchivePdf = (data, header) => axios.post(`${API_BASE_URL}/packing-slip/download`, data, { header, responseType: 'blob' })
export const sendEmailPdf = (data) => axios.post(`${API_BASE_URL}/packing-slip/email`, data)

/** LOCATION */
export const addLocation = (data) => axios.post(`${API_BASE_URL}/location/`, data)
export const updateLocation = (data, id) => axios.patch(`${API_BASE_URL}/location/${id}`, data)
export const deleteLocation = (data) => axios.delete(`${API_BASE_URL}/location/` + data)
export const getLocation = () => axios.get(`${API_BASE_URL}/location`)

/** NCR FAILED OPTION */
export const updateNCRFailedOption = (data, id) => axios.patch(`${API_BASE_URL}/failed-option/` + id, data)
export const addNCRFailedOption = (data) => axios.post(`${API_BASE_URL}/failed-option/`, data)
export const deleteNCRFailedOption = (data) => axios.delete(`${API_BASE_URL}/failed-option/` + data)

/** TREATMENTS */
export const addTreatment = (data) => axios.post(`${API_BASE_URL}/treatment/`, data)
export const updateTreatment = (data, id) => axios.patch(`${API_BASE_URL}/treatment/` + id, data)
export const deleteTreatment = (id) => axios.delete(`${API_BASE_URL}/treatment/` + id)

/** Search Filter */
export const addSearchFilter = (data) => axios.post(`${API_BASE_URL}/search-bay-filters/add-filter`, data)
export const getSearchFilter = (data) => axios.post(`${API_BASE_URL}/search-bay-filters/get-filter-by-table`, data)

/** MATERIALS */
export const getAllMaterial = () => axios.get(`${API_BASE_URL}/materials`)

/** REPORTS */
export const getJobsBayReport = (query) => axios.get(`${API_BASE_URL}/jobs-report/bay`, {params: query})
export const getFailedJobsReport = (query) => axios.get(`${API_BASE_URL}/jobs/generate/failed-report`, {params: query})
export const generateJobReport = (query) => axios.get(`${API_BASE_URL}/jobs/generate-report`, {params: query})
export const generateAmountCountJobReport = (query) => axios.get(`${API_BASE_URL}/jobs/generate/amount-report`, {params: query})
export const getJobsAmount = () => axios.get(`${API_BASE_URL}/jobs/amount`)
export const getJobsCount = () => axios.get(`${API_BASE_URL}/jobs/count`)

