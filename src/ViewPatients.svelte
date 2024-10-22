<script lang="ts">
    import { Link, navigate } from "svelte-routing";
    import API from './API';
  
    let patients = [];
    let totalPatients = 0;
    let isLoading = false;
    let error = null;
    let serverUrl = "";
    let currentPage = 1;
    let patientsPerPage = 50;

    let scrollY: number = 0;
    let innerHeight: number = 0;
  let pageHeight: number = 0;
  
  
  
    const fetchPatients = async () => {
      if (!serverUrl) {
        error = "Please enter a server URL";
        return;
      }

      isLoading = true;
      error = null;
      patients = [];
      let nextUrl = null;

      try {
        const initialResponse = await API.getPatients(serverUrl, { _count: 50 });
        
        const processData = (data) => {
          const newPatients = data.entry ? data.entry.map(entry => ({
            id: entry.resource.id,
            name: entry.resource.name?.[0]?.given?.join(' ') + ' ' + entry.resource.name?.[0]?.family || 'Unknown',
            gender: entry.resource.gender || 'Unknown',
            birthDate: entry.resource.birthDate || 'Unknown',
            phone: entry.resource.telecom?.find(t => t.system === 'phone')?.value || 'Unknown',
            identifier: entry.resource.identifier?.[0]?.value || 'Unknown'
          })) : [];

          patients = [...patients, ...newPatients];
          totalPatients = data.total || patients.length;

          // Check if there's a next page
          return data.link?.find(link => link.relation === 'next')?.url || null;
        };

        nextUrl = processData(initialResponse);

        while (nextUrl) {
          const data = await API.getPatients(nextUrl);
          nextUrl = processData(data);
        }
      } catch (err) {
        error = err.message;
        console.error("Error fetching patients:", err);
      } finally {
        isLoading = false;
      }
    };

    function handleEdit(patient) {
        navigate('/add-edit', { 
          state: { 
            isEditing: true, 
            patientId: patient.id, 
            initialPatientData: patient 
    } 
  });

}

    function navigateToPatientDetails(patientId) {
      const patientData = patients.find(p => p.id === patientId);
      navigate(`/edit/${patientId}`, {
          state: {
              id: patientId,
            initialPatientData: patientData || null
        }
      });
    }

    $: showBottomButton = scrollY > 100 && (scrollY + innerHeight < pageHeight);

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    $: totalPages = Math.ceil(patients.length / patientsPerPage);
    $: paginatedPatients = patients.slice(
      (currentPage - 1) * patientsPerPage,
      currentPage * patientsPerPage
    );

    function nextPage() {
        if (currentPage < totalPages) currentPage++;
    }

    function prevPage() {
        if (currentPage > 1) currentPage--;
    }
  </script>
  
  <svelte:window bind:scrollY bind:innerHeight />

  <main class="container"bind:clientHeight={pageHeight}>
    <section class="content">
      <div class="button-container">
        <Link to="/" class="button secondary-button">Back to Home</Link>
      </div>
      <div class="top-controls"></div>
      <div class="server-input">
        <label for="server-url">FHIR Server URL:</label>
        <input 
          id="server-url" 
          type="text" 
          bind:value={serverUrl} 
          placeholder="Enter FHIR server URL"
        />
      </div>
  
      <div class="fetch-button-container">
        <button class="button fetch-button" on:click={fetchPatients} disabled={isLoading}>
          {#if isLoading}
            <span class="loading-spinner"></span>
            Loading...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            Fetch Patients
          {/if}
        </button>
      </div>
  
      {#if error}
        <p class="error">{error}</p>
      {:else if totalPatients > 0}
        <p class="total-patients">Total Patients on Server: {totalPatients}</p>
      {/if}
  
      {#if patients.length > 0}
        <div class="table-container">
          <table class="patient-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Birth Date</th>
                <th>Phone</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedPatients as patient}
                <tr>
                  <td>{patient.id}</td>
                  <td>{patient.name}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.birthDate}</td>
                  <td>{patient.phone}</td>
                  <td>
                    <Link to="/edit/{patient.id}" state={{ patientData: patient }}>Edit Patient</Link>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          <div class="pagination">
            <button on:click={prevPage} disabled={currentPage === 1}>Previous</button>
            <span>{currentPage} of {totalPages}</span>
            <button on:click={nextPage} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      {/if}
    </section>
  
    {#if showBottomButton}
    <div class="button-container bottom-button">
        <button on:click={scrollToTop} class="button secondary-button">Scroll To Top </button>
    </div>
    {/if}

  
  </main>
  



