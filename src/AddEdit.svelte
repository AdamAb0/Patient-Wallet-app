<script lang="ts">
    import { Link, navigate } from "svelte-routing";
    import { onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import API from './api';

    export let params = {};
    export let serverUrl = '';
    export let initialPatientData = null;
    export let id = '';

    let patientId = id || params.id;
    let patient = {
        id: '',
        firstName: '',
        lastName: '',
        gender: '',
        birthDate: '',
        phone: ''
    };

    let isEditing = false;
    let isLoading = false;
    let error = null;
    let successMessage = '';

    let maxDate: string;

    const genderOptions = ['Male', 'Female', 'Other', 'Unknown'];

    const genderMappings = {
        male: 'Male',
        female: 'Female',
        other: 'Other',
        unknown: 'Unknown'
    };

    function saveServerUrl() {
        localStorage.setItem('serverUrl', serverUrl);
    }

    onMount(() => {
        console.log('Component mounted. Params:', params);
        console.log('PatientId:', patientId);
        console.log('Initial Patient Data:', initialPatientData);
        
        isEditing = !!patientId || (initialPatientData && initialPatientData.id);
        serverUrl = localStorage.getItem('serverUrl') || '';
        const today = new Date();
        maxDate = today.toISOString().split('T')[0];

        if (isEditing && initialPatientData) {
            populateFormFields(initialPatientData);
        } else if (isEditing) {
            fetchPatient();
        }
    });

    function populateFormFields(data) {
        patient = {
            id: data.id || '',
            firstName: data.name?.[0]?.given?.[0] || '',
            lastName: data.name?.[0]?.family || '',
            gender: mapFHIRGenderToOption(data.gender) || '',
            birthDate: data.birthDate || '',
            phone: data.telecom?.find(t => t.system === 'phone')?.value || ''
        };
        console.log('Populated form fields:', patient);
    }

    async function fetchPatient() {
        if (!serverUrl || !patientId) {
            error = "Missing server URL or patient ID. Please check your input.";
            return;
        }

        isLoading = true;
        error = null;

        try {
            const patientData = await API.getPatient(serverUrl, patientId);
            console.log('Fetched patient data:', patientData);
            populateFormFields(patientData);
        } catch (err) {
            error = err.message;
            console.error("Error fetching patient:", err);
        } finally {
            isLoading = false;
        }
    }

    function mapGenderToFHIR(gender: string): string {
        return Object.keys(genderMappings).find(key => genderMappings[key as keyof typeof genderMappings] === gender) || 'unknown';
    }

    function mapFHIRGenderToOption(fhirGender: string | undefined): string {
        return genderMappings[fhirGender?.toLowerCase() as keyof typeof genderMappings] || '';
    }

    async function handleSubmit() {
        if (!serverUrl) {
            error = "Please enter a server URL";
            return;
        }

        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(patient.phone)) {
            error = "Please enter a valid phone number (E.164 format)";
            return;
        }

        isLoading = true;
        error = null;
        successMessage = '';

        try {
            const patientData = {
                resourceType: "Patient",
                id: isEditing ? patientId : uuidv4(),
                name: [{
                    use: "official",
                    family: patient.lastName,
                    given: [patient.firstName]
                }],
                gender: mapGenderToFHIR(patient.gender),
                birthDate: patient.birthDate,
                telecom: [{
                    system: "phone",
                    value: patient.phone,
                    use: "mobile"
                }]
            };

            if (isEditing) {
                await API.updatePatient(serverUrl, patientId, patientData);
            } else {
                const newPatient = await API.createPatient(serverUrl, patientData);
                patient.id = newPatient.id;
                isEditing = true;
                patientId = newPatient.id;
            }

            successMessage = isEditing ? "Patient updated successfully" : "Patient created successfully";
            saveServerUrl();
        } catch (err) {
            error = err.message;
            console.error("Error saving patient:", err);
        } finally {
            isLoading = false;
        }
    }

    async function handleDelete() {
        if (!serverUrl || !patientId) {
            error = "Missing server URL or patient ID. Cannot delete.";
            return;
        }

        if (confirm('Are you sure you want to delete this patient?')) {
            isLoading = true;
            error = null;
            successMessage = '';

            try {
                await API.deletePatient(serverUrl, patientId);
                successMessage = "Patient deleted successfully";
                patient = {
                    id: '',
                    firstName: '',
                    lastName: '',
                    gender: '',
                    birthDate: '',
                    phone: ''
                };
                isEditing = false;
                patientId = '';
            } catch (err) {
                error = err.message;
                console.error("Error deleting patient:", err);
            } finally {
                isLoading = false;
            }
        }
    }
</script>

<div class="form-container">
    <h2 class="subtitle">{isEditing ? 'Edit' : 'Add'} Patient Information</h2>
    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="serverUrl">Server URL:</label>
            <input type="text" id="serverUrl" bind:value={serverUrl} required placeholder="Enter server URL">
        </div>
        <div class="form-group">
            <label for="firstName">First Name *</label>
            <input type="text" id="firstName" bind:value={patient.firstName} required>
        </div>
        <div class="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" bind:value={patient.lastName}>
        </div>
        <div class="form-group">
            <label for="gender">Gender *</label>
            <select id="gender" bind:value={patient.gender} required>
                <option value="">Select gender</option>
                {#each genderOptions as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </div>
        <div class="form-group">
            <label for="birthDate">Date of Birth *</label>
            <input type="date" id="birthDate" bind:value={patient.birthDate} max={maxDate} required>
        </div>
        <div class="form-group">
            <label for="phone">Phone Number * (E.164 format, e.g. +12345678900)</label>
            <input type="tel" id="phone" bind:value={patient.phone} required placeholder="+12345678900">
        </div>
        <div class="button-container">
            <button type="submit" class="button primary-button" disabled={isLoading}>
                {isLoading ? 'Processing...' : isEditing ? 'Update' : 'Submit'}
            </button>
            
            {#if isEditing}
                <button type="button" class="button delete-button" on:click={handleDelete} disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Delete Patient'}
                </button>
            {/if}
            
            <Link to="/" class="button secondary-button">Go to Main Page</Link>
            <Link to="/view-patients" class="button secondary-button">Go to Patient List</Link>
            <Link to="/search-patient" class="button secondary-button">Search Patient</Link>
        </div>
    </form>
</div>

{#if error}
    <div class="notification error">
        <p>{error}</p>
    </div>
{/if}

{#if successMessage}
    <div class="notification success">
        <p>{successMessage}</p>
    </div>
{/if}