"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { useUser, useAuth } from "@Clerk/nextjs";
import toast from "react-hot-toast";

export default function AdmissionApplicationForm() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  const [existingApp, setExistingApp] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  /* Form disabled when NOT Draft */
  const formDisabled = existingApp && existingApp.status !== "Draft";

  /* ----------------------------------------------
     REACT HOOK FORM
  ------------------------------------------------ */
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      identity: {},
      studyDetails: {},
      marks: {},
      contact: { postalAddress: {} },
      permanentAddress: {},
      currentAddress: {},
      parents: [
        {
          name: "",
          relationship: "Parent",
          phone: "",
          email: "",
          occupation: "",
        },
      ],
      courseOptions: [
        {
          priorityNumber: 1,
          courseName: "",
          instituteCode: "",
          collegeName: "",
        },
      ],
    },
  });

  const {
    fields: parentFields,
    append: addParent,
    remove: removeParent,
  } = useFieldArray({ control, name: "parents" });

  const {
    fields: courseFields,
    append: addCourse,
    remove: removeCourse,
  } = useFieldArray({ control, name: "courseOptions" });

  /* ----------------------------------------------
     HANDLE PHOTO UPLOAD
  ------------------------------------------------ */
  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);
      toast.success("Photo selected!");
    }
  };

  /* ----------------------------------------------
     FETCH EXISTING APPLICATION
  ------------------------------------------------ */
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/my`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data?.data) {
          setExistingApp(res.data.data);
          setIsEditing(true);
          reset(res.data.data);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchExisting();
  }, []);

  /* ----------------------------------------------
     SUBMIT / UPDATE APPLICATION
  ------------------------------------------------ */
  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated!");
        return;
      }

      const fd = new FormData();
      fd.append("clerkId", user.id);
      fd.append("email", user?.emailAddresses?.[0]?.emailAddress || "");
      fd.append("name", user.fullName || user.firstName || "");

      Object.keys(formData).forEach((key) => {
        fd.append(key, JSON.stringify(formData[key]));
      });

      if (!photoFile && !isEditing) {
        toast.error("Please upload a photo");
        return;
      }

      if (photoFile) fd.append("photo", photoFile);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        toast.success(
          isEditing ? "Application updated!" : "Application submitted!"
        );
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------
     FINAL SUBMIT TO OFFICE (Draft → Pending)
  ------------------------------------------------ */
  const submitToOffice = async () => {
    try {
      if (!existingApp) {
        toast.error("Fill application before submitting!");
        return;
      }

      const token = await getToken();

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admission-applications/update-status/${existingApp._id}`,
        { status: "Pending" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Application submitted to office!");
      window.location.reload();
    } catch (err) {
      toast.error("Unable to submit to office");
    }
  };

  /* --------------------------------------------------------------
     UI
  -------------------------------------------------------------- */
  const input =
    "border p-3 rounded-lg w-full bg-white/80 focus:ring-4 focus:ring-indigo-300 focus:outline-none shadow-sm";
  const section =
    "p-8 rounded-2xl shadow-xl bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur border border-indigo-100 space-y-6";
  const title =
    "text-2xl font-bold text-indigo-700 bg-gradient-to-r from-indigo-100 to-purple-100 p-3 rounded-lg border-l-4 border-indigo-600";

  return (
    <div className="max-w-7xl mx-auto p-10 space-y-12 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
      <h1 className="text-5xl font-extrabold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow">
        Admission Application Form
      </h1>

      {/* Show current status */}
      {existingApp && (
        <div className="text-center text-lg font-semibold mb-6">
          Current Status:{" "}
          <span className="px-3 py-1 rounded-full bg-indigo-200 text-indigo-800">
            {existingApp.status}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* --------------------------------------------------------------
            ADMISSION DETAILS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Admission Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select
              {...register("entryType")}
              className={input}
              disabled={formDisabled}
            >
              <option value="">Select Entry Type</option>
              <option value="SSLC">SSLC</option>
              <option value="PU">PU</option>
              <option value="ITI">ITI</option>
              <option value="LATERAL-PU">Lateral PU → 2nd Year</option>
              <option value="LATERAL-ITI">Lateral ITI → 2nd Year</option>
            </select>

            <input
              type="number"
              {...register("entryYear")}
              placeholder="Entry Year"
              className={input}
              disabled={formDisabled}
            />

            <select
              {...register("program")}
              className={input}
              disabled={formDisabled}
            >
              <option value="Diploma">Diploma</option>
            </select>
          </div>
        </section>

        {/* --------------------------------------------------------------
            PHOTO UPLOAD
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Upload Student Photo</h2>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className={input}
            disabled={formDisabled}
          />

          {photoFile && (
            <p className="text-green-700 font-semibold mt-2">
              ✔ Photo uploaded successfully!
            </p>
          )}
        </section>

        {/* --------------------------------------------------------------
            IDENTITY
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Identity Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              {...register("identity.satsNo")}
              placeholder="SATS No"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("identity.aadharNo")}
              placeholder="Aadhar No"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("identity.studentName")}
              placeholder="Student Full Name"
              className={input}
              disabled={formDisabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              {...register("identity.motherName")}
              placeholder="Mother Name"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("identity.fatherName")}
              placeholder="Father Name"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="date"
              {...register("identity.dob")}
              className={input}
              disabled={formDisabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select
              {...register("identity.gender")}
              className={input}
              disabled={formDisabled}
            >
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              {...register("identity.nationality")}
              placeholder="Nationality"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("identity.religion")}
              placeholder="Religion"
              className={input}
            />
          </div>
        </section>

        {/* --------------------------------------------------------------
            STUDY DETAILS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Study Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <select
              {...register("studyDetails.qualifyingExam")}
              className={input}
              disabled={formDisabled}
            >
              <option value="">Qualifying Exam</option>
              <option>SSLC</option>
              <option>CBSE</option>
              <option>ICSE</option>
              <option>OTHER</option>
            </select>

            <input
              {...register("studyDetails.nativeStateCode")}
              placeholder="Native State Code"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("studyDetails.nativeDistrictCode")}
              placeholder="Native District Code"
              className={input}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              type="number"
              {...register("studyDetails.karnatakaStudyYears")}
              placeholder="Years Studied in Karnataka"
              className={input}
              disabled={formDisabled}
            />

            <label className="flex items-center gap-2 text-indigo-700">
              <input
                type="checkbox"
                {...register("studyDetails.studiedInRural")}
              />
              Studied in Rural Area
            </label>

            <label className="flex items-center gap-2 text-indigo-700">
              <input
                type="checkbox"
                {...register("studyDetails.studiedInKannadaMedium")}
              />
              Kannada Medium
            </label>
          </div>

          <label className="flex items-center gap-2 text-indigo-700">
            <input
              type="checkbox"
              {...register("studyDetails.studyExemption")}
            />
            Exempted from 5-Year Study Rule
          </label>

          <input
            {...register("studyDetails.exemptionClauseCode")}
            placeholder="Exemption Clause Code"
            className={input}
            disabled={formDisabled}
          />

          <h3 className="font-semibold text-indigo-700 mt-4">
            Special Categories
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "NCC",
              "JTS",
              "JOC",
              "EDP",
              "DP",
              "PS",
              "SP",
              "SG",
              "PH",
              "AI",
              "CI",
              "HK",
              "GK",
              "ITI",
            ].map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 text-indigo-700"
              >
                <input
                  type="checkbox"
                  value={cat}
                  {...register("studyDetails.specialCategory")}
                />
                {cat}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <label className="flex items-center gap-2 text-indigo-700">
              <input
                type="checkbox"
                {...register("studyDetails.hydKarQuota")}
              />
              Hyderabad-Karnataka Quota
            </label>

            <label className="flex items-center gap-2 text-indigo-700">
              <input type="checkbox" {...register("studyDetails.snqQuota")} />
              SNQ Quota
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              {...register("studyDetails.categoryCode")}
              placeholder="Category Code"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("studyDetails.casteName")}
              placeholder="Caste Name"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("studyDetails.parentAnnualIncome")}
              placeholder="Annual Income"
              className={input}
            />
          </div>
        </section>

        {/* --------------------------------------------------------------
            MARKS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Marks</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              {...register("marks.sslcRegisterNumber")}
              placeholder="SSLC Register Number"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.sslcPassYear")}
              placeholder="SSLC Pass Year"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.totalMaxMarks")}
              placeholder="Total Max Marks"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.totalMarksObtained")}
              placeholder="Total Obtained Marks"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.scienceMax")}
              placeholder="Science Max"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.scienceObtained")}
              placeholder="Science Obtained"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.mathsMax")}
              placeholder="Maths Max"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.mathsObtained")}
              placeholder="Maths Obtained"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.totalScienceMathsMax")}
              placeholder="Science+Maths Max"
              className={input}
              disabled={formDisabled}
            />
            <input
              type="number"
              {...register("marks.totalScienceMathsObtained")}
              placeholder="Science+Maths Obtained"
              className={input}
              disabled={formDisabled}
            />
          </div>
        </section>

        {/* --------------------------------------------------------------
            CONTACT
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Contact</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              {...register("contact.studentMobile")}
              placeholder="Student Mobile"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("contact.parentMobile")}
              placeholder="Parent Mobile"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("contact.email")}
              placeholder="Email"
              className={input}
              disabled={formDisabled}
            />
          </div>

          <h3 className="font-semibold text-indigo-700 mt-4">Postal Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              {...register("contact.postalAddress.line1")}
              placeholder="Line 1"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("contact.postalAddress.line2")}
              placeholder="Line 2"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("contact.postalAddress.city")}
              placeholder="City"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("contact.postalAddress.state")}
              placeholder="State"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("contact.postalAddress.pincode")}
              placeholder="Pincode"
              className={input}
              disabled={formDisabled}
            />
          </div>
        </section>

        {/* --------------------------------------------------------------
            PERMANENT ADDRESS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Permanent Address</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              {...register("permanentAddress.line1")}
              placeholder="Line 1"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("permanentAddress.line2")}
              placeholder="Line 2"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("permanentAddress.city")}
              placeholder="City"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("permanentAddress.state")}
              placeholder="State"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("permanentAddress.pincode")}
              placeholder="Pincode"
              className={input}
              disabled={formDisabled}
            />
          </div>
        </section>

        {/* --------------------------------------------------------------
            CURRENT ADDRESS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Current Address</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              {...register("currentAddress.line1")}
              placeholder="Line 1"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("currentAddress.line2")}
              placeholder="Line 2"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("currentAddress.city")}
              placeholder="City"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("currentAddress.state")}
              placeholder="State"
              className={input}
              disabled={formDisabled}
            />
            <input
              {...register("currentAddress.pincode")}
              placeholder="Pincode"
              className={input}
              disabled={formDisabled}
            />
          </div>
        </section>

        {/* --------------------------------------------------------------
            PARENTS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Parent / Guardian</h2>

          {parentFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white/60 p-6 rounded-xl border shadow-md"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input
                  {...register(`parents.${index}.name`)}
                  placeholder="Name"
                  className={input}
                  disabled={formDisabled}
                />
                <input
                  {...register(`parents.${index}.relationship`)}
                  placeholder="Relationship"
                  className={input}
                  disabled={formDisabled}
                />
                <input
                  {...register(`parents.${index}.phone`)}
                  placeholder="Phone"
                  className={input}
                  disabled={formDisabled}
                />
                <input
                  {...register(`parents.${index}.email`)}
                  placeholder="Email"
                  className={input}
                  disabled={formDisabled}
                />
                <input
                  {...register(`parents.${index}.occupation`)}
                  placeholder="Occupation"
                  className={input}
                  disabled={formDisabled}
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  className="mt-3 text-red-600"
                  onClick={() => removeParent(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              addParent({
                name: "",
                relationship: "Parent",
                phone: "",
                email: "",
                occupation: "",
              })
            }
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
          >
            + Add Parent
          </button>
        </section>

        {/* --------------------------------------------------------------
            COURSE OPTIONS
        -------------------------------------------------------------- */}
        <section className={section}>
          <h2 className={title}>Course Preferences</h2>

          {courseFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white/60 p-6 rounded-xl border shadow-md"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input
                  {...register(`courseOptions.${index}.priorityNumber`)}
                  placeholder="Priority"
                  className={input}
                  disabled={formDisabled}
                  type="number"
                />
                <input
                  {...register(`courseOptions.${index}.courseName`)}
                  placeholder="Course Name"
                  className={input}
                  disabled={formDisabled}
                />
                <input
                  {...register(`courseOptions.${index}.instituteCode`)}
                  placeholder="Institute Code"
                  className={input}
                  disabled={formDisabled}
                />
                <input
                  {...register(`courseOptions.${index}.collegeName`)}
                  placeholder="College Name"
                  className={input}
                  disabled={formDisabled}
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  className="mt-3 text-red-600"
                  onClick={() => removeCourse(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              addCourse({
                priorityNumber: courseFields.length + 1,
                courseName: "",
                instituteCode: "",
                collegeName: "",
              })
            }
            className="px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            + Add Course Preference
          </button>
        </section>

        <section className={section}>
          <h2 className={title}>Notes</h2>

          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Any additional notes..."
            className={input}
            disabled={formDisabled}
          />

          {/* Save / Update */}
          {!formDisabled && (
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-xl shadow hover:bg-indigo-700"
            >
              {isEditing ? "Update Application" : "Save Application"}
            </button>
          )}

          {/* Final Submit to Office */}
          {isEditing && existingApp?.status === "Draft" && (
            <button
              type="button"
              onClick={submitToOffice}
              className="mt-4 w-full bg-green-600 text-white py-4 rounded-xl shadow hover:bg-green-700"
            >
              Final Submit to Office
            </button>
          )}
        </section>
      </form>
    </div>
  );
}
