// API Client for BBQ Manager - works with your server
// Using ASHX (C#) as PHP doesn't work on this server
// In development, use proxy through Vite; in production, use full URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api-bbq.ashx' : 'https://ophir.travelsure.co.il/api-bbq.ashx');

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
      // Read response text once
      const text = await response.text();
      console.error(`API Error [${response.status}]:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        responseText: text.substring(0, 500)
      });
      
      let errorData: any = null;
      
      // Try to parse as JSON, but fallback to text if it fails
      try {
        // Check if response is HTML (404 page) instead of JSON
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`, 
            details: 'Server returned HTML instead of JSON. File may not exist or PHP is not configured correctly.' 
          };
        } else if (text.trim()) {
          // Try to parse as JSON
          errorData = JSON.parse(text);
        } else {
          errorData = { error: 'Unknown error' };
        }
      } catch (parseError) {
        // If parsing fails, use the raw text
        console.error('Failed to parse error response:', parseError, 'Raw text:', text.substring(0, 500));
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`, 
          details: text || 'Unknown error' 
        };
      }
      
      const errorMessage = errorData?.error || errorData?.details || errorData?.message || text || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    // Remove BOM if present
    const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError: any) {
      console.error('JSON Parse Error:', {
        error: parseError.message,
        position: parseError.message.match(/position (\d+)/)?.[1],
        text: cleanText.substring(0, 200),
        fullText: cleanText
      });
      throw new Error(`Invalid JSON response: ${parseError.message}. Response: ${cleanText.substring(0, 200)}`);
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
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=groups&id=${id}&action=update`, {
      method: 'POST',
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

  async updateMember(id: string, data: any): Promise<any> {
    return this.request(`entity=members&id=${id}&action=update`, {
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

  async updateEvent(id: string, data: any): Promise<any> {
    return this.request(`entity=events&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string): Promise<void> {
    // Use POST with action=delete instead of DELETE to avoid IIS restrictions
    await this.request(`entity=events&id=${id}&action=delete`, {
      method: 'POST',
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
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=payments&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentByPayer(eventId: string, payerId: string, payerType: string): Promise<any | null> {
    const payments = await this.getPayments(eventId);
    return payments.find((p: any) => p.payer_id === payerId && p.payer_type === payerType) || null;
  }

  async deletePayment(id: string): Promise<void> {
    return this.request(`entity=payments&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  // Users
  async getUsers(): Promise<any[]> {
    return this.request('entity=users');
  }

  async getUser(id: string): Promise<any> {
    return this.request(`entity=users&id=${id}`);
  }

  async getUserByPhone(phone: string): Promise<any | null> {
    const users = await this.getUsers();
    return users.find((u: any) => u.phone === phone) || null;
  }

  async createUser(data: any): Promise<any> {
    return this.request('entity=users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=users&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Group Invitations
  async getGroupInvitations(userPhone?: string, groupId?: string): Promise<any[]> {
    let query = 'entity=group_invitations';
    if (userPhone) {
      query += `&user_phone=${encodeURIComponent(userPhone)}`;
    }
    if (groupId) {
      query += `&group_id=${encodeURIComponent(groupId)}`;
    }
    return this.request(query);
  }

  async createGroupInvitation(data: any): Promise<any> {
    return this.request('entity=group_invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGroupInvitation(id: string, data: any): Promise<any> {
    return this.request(`entity=group_invitations&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteGroupInvitation(id: string): Promise<void> {
    return this.request(`entity=group_invitations&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  // Polls
  async getPolls(groupId?: string): Promise<any[]> {
    const params = groupId ? `entity=polls&group_id=${groupId}` : 'entity=polls';
    return this.request(params);
  }

  async getPoll(id: string): Promise<any> {
    return this.request(`entity=polls&id=${id}`);
  }

  async createPoll(data: any): Promise<any> {
    return this.request('entity=polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePoll(id: string, data: any): Promise<any> {
    return this.request(`entity=polls&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePoll(id: string): Promise<void> {
    return this.request(`entity=polls&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  async votePoll(pollId: string, optionId: string, memberId: string): Promise<any> {
    return this.request('entity=polls&action=vote', {
      method: 'POST',
      body: JSON.stringify({
        poll_id: pollId,
        option_id: optionId,
        member_id: memberId
      }),
    });
  }
}

export const apiClient = new ApiClient();
