import axios from 'axios';

class API {
  async getPatients(serverUrl: string, params: {
    name?: string,
    phone?: string,
    _count?: number
  } = {}) {
    let url = `${serverUrl}/Patient`;
    const queryParams = new URLSearchParams();

    if (params.name) {
      const terms = params.name.trim().split(/\s+/);
      terms.forEach(term => queryParams.append('name', term));
    }

    if (params.phone) {
      queryParams.append('telecom', `phone|${params.phone}`);
    }

    if (params._count) {
      queryParams.append('_count', params._count.toString());
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    console.log('Fetching patients from URL:', url);
    
    try {
      const response = await axios.get(url, {
        headers: { 'Accept': 'application/fhir+json' },
        withCredentials: false // This might help with CORS in some cases
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new Error(`Server error: ${error.response.status} ${error.response.statusText}`);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from server. This might be a CORS issue.');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Error setting up the request: ${error.message}`);
        }
      } else {
        // Something else happened
        throw new Error('An unexpected error occurred');
      }
    }
  }

  async getPatient(serverUrl: string, id: string) {
    const response = await axios.get(`${serverUrl}/Patient/${id}`);
    return response.data;
  }

  async createPatient(serverUrl: string, patientData: any) {
    const response = await axios.post(`${serverUrl}/Patient`, patientData, {
      headers: { 'Content-Type': 'application/fhir+json' }
    });
    return response.data;
  }

  async updatePatient(serverUrl: string, id: string, patientData: any) {
    const response = await axios.put(`${serverUrl}/Patient/${id}`, patientData, {
      headers: { 'Content-Type': 'application/fhir+json' }
    });
    return response.data;
  }

  async deletePatient(serverUrl: string, id: string) {
    await axios.delete(`${serverUrl}/Patient/${id}`);
  }
}

export { API };
export default new API();