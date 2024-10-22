<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import { debounce } from 'lodash-es';
  import API from './API';

  let serverUrl = '';
  let searchName = '';
  let searchPhone = '';
  
  let searchResults = [];
  let showNotification = false;
  let notificationMessage = '';
  let notificationType = '';
  let isLoading = false;

  onMount(() => {
    // Load the server URL from localStorage or set a default
    serverUrl = localStorage.getItem('serverUrl') || 'https://fhir-bootcamp.medblocks.com/fhir';
  });

  const debouncedSearch = debounce(searchPatients, 300);

  async function searchPatients() {
    isLoading = true;
    
    if (!serverUrl) {
      showNotification = true;
      notificationMessage = 'Please enter a server URL';
      notificationType = 'error';
      isLoading = false;
      return;
    }

    // Check if any search field is filled
    if (!searchName && !searchPhone) {
      showNotification = true;
      notificationMessage = 'Please enter at least one search criteria';
      notificationType = 'error';
      isLoading = false;
      return;
    }

    try {
      const data = await API.getPatients(serverUrl, {
        name: searchName,
        phone: searchPhone,
        _count: 100
      });
      
      searchResults = data.entry ? data.entry.map(entry => entry.resource) : [];
      
      // Additional client-side filtering
      if (searchName) {
        const lowercaseSearchName = searchName.toLowerCase();
        searchResults = searchResults.filter(patient => {
          const fullName = `${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`.toLowerCase();
          return fullName.includes(lowercaseSearchName);
        });
      }

      if (searchPhone) {
        const normalizedSearchPhone = searchPhone.replace(/\D/g, '');
        searchResults = searchResults.filter(patient => {
          const phoneNumbers = patient.telecom
            ?.filter(t => t.system === 'phone')
            .map(t => {
              // Handle both numeric and text-based phone numbers
              const normalized = t.value.replace(/\D/g, '');
              return normalized.length > 0 ? normalized : t.value.toLowerCase();
            });
          return phoneNumbers.some(phone => 
            phone.includes(normalizedSearchPhone) || 
            phone.includes(searchPhone.toLowerCase())
          );
        });
      }

     

      showNotification = true;
      notificationMessage = `${searchResults.length} patient(s) found`;
      notificationType = 'success';

    } catch (error) {
      console.error('Error searching patients:', error);
      showNotification = true;
      if (error.message.includes('CORS')) {
        notificationMessage = 'CORS error: Unable to access the server. Please check server configuration or try using a CORS proxy.';
      } else if (error.message.includes('Server error')) {
        notificationMessage = `Server error: ${error.message}. Please check your search parameters and try again.`;
      } else {
        notificationMessage = `Error searching patients: ${error.message}. Please try again.`;
      }
      notificationType = 'error';
    } finally {
      isLoading = false;
    }
  }

  function navigateTo(path) {
    navigate(path);
  }

  function navigateToEdit(patient) {
    navigate('/add-edit', { 
      state: { 
        isEditing: true, 
        patientId: patient.id, 
        initialPatientData: patient 
      } 
    });
  }

  function handleEdit(patient) {
    console.log('Navigating to edit with patient:', patient);
    navigate('/add-edit', { 
        state: { 
            isEditing: true, 
            patientId: patient.id, 
            initialPatientData: patient 
        } 
    });
  }

</script>

<main>
  <h1>Search Patients</h1>
  <form on:submit|preventDefault={searchPatients}>
    <div class="form-group">
      <label for="serverUrl">Server URL:</label>
      <input id="serverUrl" bind:value={serverUrl} placeholder="Enter server URL" />
    </div>

    <div class="form-group">
      <label for="searchName">Name:</label>
      <input id="searchName" bind:value={searchName} placeholder="Enter patient name" />
    </div>

    <div class="form-group">
      <label for="searchPhone">Phone Number:</label>
      <input id="searchPhone" bind:value={searchPhone} on:input={debouncedSearch} placeholder="Enter phone number" />
    </div>

    

     <button type="submit" class="btn btn-primary" disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
  </form>

  {#if searchResults.length > 0}
  <table class="patient-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Gender</th>
        <th>Birth Date</th>
        <th>Phone</th>
        
      </tr>
    </thead>
    <tbody>
      {#each searchResults as patient}
        <tr>
          <td>{patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}</td>
          <td>{patient.gender || 'N/A'}</td>
          <td>{patient.birthDate || 'N/A'}</td>
          <td>{patient.telecom?.find(t => t.system === 'phone')?.value || 'N/A'}</td>
          
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p>No results found.</p>
{/if}

{#if showNotification}
  <div class={`notification ${notificationType}`}>
    {notificationMessage}
  </div>
{/if}

<div class="navigation-buttons">
  <button class="btn" on:click={() => navigateTo('/')}>Back to Main Page</button>
  <button class="btn" on:click={() => navigateTo('/view-patients')}>Go to Patient List</button>
  <button class="btn" on:click={() => navigateTo('/add-edit')}>Go to Add/Edit Patient</button>
</div>
</main>
