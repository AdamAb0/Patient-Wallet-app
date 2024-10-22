<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import ViewPatients from "./ViewPatients.svelte";
  import AddEdit from "./AddEdit.svelte";
  import Search from "./Search.svelte";

  export let url = "";
  const serverUrl = localStorage.getItem('serverUrl') || '';
</script>

<Router {url}>
  <main class="main-container">
    <header class="header">
      <h1 class="title">Patient Wallet</h1>
      <p class="subtitle">Your patient profile manager</p>
    </header>
    
    <Route path="/add-edit-patient" component={AddEdit} />
    <Route path="/view-patients" component={ViewPatients} />
    <Route path="/patient/:id/edit" component={AddEdit} />
    <Route path="/edit/:id" let:params >
      <AddEdit {params} id={params.id} />
    </Route>
    <Route path="/add-edit" let:params let:location>
      <AddEdit 
        isEditing={location?.state?.isEditing || false}
        patientId={location?.state?.patientId || ''}
        initialPatientData={location?.state?.initialPatientData || null}
      />
      <Route path="/edit/:id" let:params let:location>
        <AddEdit {params} initialPatientData={location.state?.patientData} />
      </Route>
    </Route>
    <Route path="/search-patient" component={Search} /> 
  
    <Route path="/">
      <nav class="button-container">
        <Link to="/view-patients" class="btn">View Patients</Link>
        <Link to="/search-patient" class="btn">Search Patient</Link>
        <Link to="/add-edit-patient" class="btn">Add/Edit Patient</Link>
      </nav>
    </Route>

    <section class="content-section">
      <!-- This is where you'll add your main page content or route other components -->
    </section>
  </main>
</Router>
