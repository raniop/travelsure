// API Client for BBQ Manager - works with your server
// Using ASHX (C#) as PHP doesn't work on this server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api-bbq.ashx';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}?${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        // Check if response is HTML (404 page) instead of JSON
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`, 
            details: 'Server returned HTML instead of JSON. File may not exist or PHP is not configured correctly.' 
          };
        } else {
          errorData = text ? JSON.parse(text) : { error: 'Unknown error' };
        }
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // If not JSON, read as text first to see what we got
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }
    }
  }

  // Groups
  async getGroups(): Promise<any[]> {
    return this.request('entity=groups');
  }

  async getGroup(id: string): Promise<any> {
    return this.request(`entity=groups&id=${id}`);
  }

  async createGroup(data: any): Promise<any> {
    return this.request('entity=groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGroup(id: string, data: any): Promise<any> {
    return this.request(`entity=groups&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Members
  async getMembers(groupId?: string): Promise<any[]> {
    const params = groupId ? `entity=members&group_id=${groupId}` : 'entity=members';
    return this.request(params);
  }

  async createMember(data: any): Promise<any> {
    return this.request('entity=members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMember(id: string): Promise<void> {
    await this.request(`entity=members&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(groupId?: string): Promise<any[]> {
    const params = groupId ? `entity=events&group_id=${groupId}` : 'entity=events';
    return this.request(params);
  }

  async getEvent(id: string): Promise<any> {
    return this.request(`entity=events&id=${id}`);
  }

  async createEvent(data: any): Promise<any> {
    return this.request('entity=events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Attendees
  async getAttendees(eventId: string): Promise<any[]> {
    return this.request(`entity=attendees&event_id=${eventId}`);
  }

  async createAttendee(data: any): Promise<any> {
    return this.request('entity=attendees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendee(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=attendees&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Guests
  async getGuests(eventId: string): Promise<any[]> {
    return this.request(`entity=guests&event_id=${eventId}`);
  }

  async createGuest(data: any): Promise<any> {
    return this.request('entity=guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGuest(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=guests&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPayments(eventId?: string): Promise<any[]> {
    const params = eventId ? `entity=payments&event_id=${eventId}` : 'entity=payments';
    return this.request(params);
  }

  async createPayment(data: any): Promise<any> {
    return this.request('entity=payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: string, data: any): Promise<any> {
    return this.request(`entity=payments&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPaymentByPayer(eventId: string, payerId: string, payerType: string): Promise<any | null> {
    const payments = await this.getPayments(eventId);
    return payments.find((p: any) => p.payer_id === payerId && p.payer_type === payerType) || null;
  }
}

export const apiClient = new ApiClient();
