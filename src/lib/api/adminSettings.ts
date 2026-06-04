// Admin Settings / Site / Payment / Sub-settings API
import { request } from "./client";
import type { ApiResponse } from "./types";

type Dict = Record<string, any>;

function get(path: string) {
  return request<ApiResponse<any>>(path).then((r) => r.data);
}
function put(path: string, body: Dict) {
  return request<ApiResponse<any>>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export const adminSettingsApi = {
  // General settings
  get: () => get(`/admin/settings`),
  update: (body: Dict) => put(`/admin/settings`, body),

  // Site
  getSite: () => get(`/admin/site`),
  updateSite: (body: Dict) => put(`/admin/site`, body),

  // Appearance
  getAppearance: () => get(`/admin/settings/appearance`),
  updateAppearance: (body: Dict) => put(`/admin/settings/appearance`, body),

  // Integrations
  getIntegrations: () => get(`/admin/settings/integrations`),
  updateIntegrations: (body: Dict) => put(`/admin/settings/integrations`, body),

  // Notifications
  getNotifications: () => get(`/admin/settings/notifications`),
  updateNotifications: (body: Dict) => put(`/admin/settings/notifications`, body),

  // Profile
  getProfile: () => get(`/admin/settings/profile`),
  updateProfile: (body: Dict) => put(`/admin/settings/profile`, body),

  // Team
  getTeam: () => get(`/admin/settings/team`),
  updateTeam: (body: Dict) => put(`/admin/settings/team`, body),

  // Payment
  getPayment: () => get(`/admin/payment`),
  updatePayment: (body: Dict) => put(`/admin/payment`, body),
};
