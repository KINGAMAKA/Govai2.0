/* GOVAI guided demos, chat edition.
   A conversation engine: each of the three demos asks 10 short questions as normal chat messages,
   answers "what does that mean?" style questions, then shows a demo result card in the chat.
   Pure logic, no DOM except cardHTML(). Demo only: nothing is sent anywhere and all numbers are made up. */
(() => {
  "use strict";
  const PROVINCES = ["Central","Copperbelt","Eastern","Luapula","Lusaka","Muchinga","Northern","North-Western","Southern","Western"];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rnd = (n) => Array.from({length:n}, () => Math.floor(Math.random()*10)).join("");
  const spaced = (s) => String(s).replace(/\D/g, "").split("").join(" ");
  const today = () => new Date().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
  const longDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return iso; return new Date(+m[1], +m[2]-1, +m[3]).toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"}); };
  function lowerFirst(s) { s = String(s || "").trim(); return s ? s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, "") : s; }

  /* ---------- The three flows: 10 short questions each ----------
     k=key, label, q=question, hint, opts=tap choices, alias=spoken synonyms, fmt=value format,
     explain/ex = plain-language answer to "what does that mean?" */
  const FLOWS = {
    business: {
      key: "business", title: "PACRA Form 3 – Company incorporation", opener: "Let's prepare your PACRA Form 3 application for company incorporation.",
      steps: [
        {k:"companyType",label:"Company type",q:"First, what type of company are you incorporating?",opts:["Private company limited by shares","Private company limited by guarantee","Public limited company","Unlimited private company"],alias:{"Private company limited by shares":["private limited","limited by shares"],"Private company limited by guarantee":["guarantee","limited guarantee"],"Public limited company":["public company"],"Unlimited private company":["unlimited"]},explain:"Form 3 provides different company types. A company limited by shares has shareholders; a company limited by guarantee has guarantors."},
        {k:"category",label:"Company category",q:"Does the company fall into a special category?",opts:["Ordinary / Other","Local bank","Foreign bank","Insurance company","Re-insurance company","Bureau de change","Financial institution"],explain:"Choose a regulated category if it applies. Otherwise select Ordinary / Other."},
        {k:"categoryOther",label:"Other category",q:"If you selected Other, describe the category. Otherwise say not applicable.",ph:"Not applicable",req:false,explain:"Only complete this if the company has another special category."},
        {k:"name",label:"Approved company name",q:"What exact company name has PACRA approved?",ph:"Hardware Stores Limited",fmt:"title",explain:"Enter the name exactly as approved by the Company Registry. Form 3 notes that the name reservation must not have expired."},
        {k:"activity",label:"Principal business activity",q:"What will be the company's principal business activity?",ph:"Retail sale of hardware and building materials",explain:"Describe the main activity clearly. PACRA notes that activities are classified using ISIC."},
        {k:"otherActivities",label:"Other business activities",q:"Will the company carry out other business activities? List them, or say none.",ph:"Construction supplies and equipment hire",req:false,explain:"Include additional activities beyond the principal activity."},
        {k:"restrict",label:"Articles restriction",q:"Will the company's articles restrict the nature of its business?",opts:["No","Yes"],alias:{"No":["no restriction","not restricted"],"Yes":["restricted"]},explain:"Form 3 asks whether the articles restrict the nature of the company's business."},
        {k:"articles",label:"Articles type",q:"Will the company use standard or non-standard articles?",opts:["Standard","Non-standard"],alias:{"Standard":["normal","standard articles"],"Non-standard":["custom","special"]},explain:"Standard articles use the prescribed standard provisions. Non-standard articles are tailored; seek professional advice where needed."},
        {k:"physicalPlot",label:"Registered office plot / house",q:"What is the plot, house number or village for the registered office?",ph:"Plot 12",explain:"This begins the company's registered physical office address."},
        {k:"physicalStreet",label:"Registered office street",q:"What street or road is the registered office on?",ph:"Independence Avenue",req:false,explain:"Enter the street or road, if applicable."},
        {k:"physicalArea",label:"Registered office area",q:"Which area or neighbourhood is the registered office in?",ph:"Riverside",req:false,explain:"The area or neighbourhood helps identify the registered office."},
        {k:"town",label:"Registered office town",q:"Which town is the registered office in?",ph:"Kitwe",fmt:"title",explain:"Enter the town for the registered office."},
        {k:"province",label:"Registered office province",q:"Which province is the registered office in?",opts:PROVINCES,explain:"Select the Zambian province for the registered office."},
        {k:"postal",label:"Postal address",q:"What is the company's postal address or P.O. Box? You can say same as physical address if appropriate.",ph:"P.O. Box 123, Kitwe",explain:"Form 3 asks for a postal notification address, including area, town and province. GOVAI will record the details you provide."},
        {k:"phone",label:"Company phone",q:"What company mobile number should PACRA use? Include the country code if possible.",ph:"+260 977 123 456",fmt:"tel",explain:"Use the international code, for example +260 for Zambia."},
        {k:"landline",label:"Company landline",q:"Does the company have a landline? If not, say not applicable.",ph:"Not applicable",req:false,explain:"A landline is optional where the company does not have one."},
        {k:"email",label:"Company email",q:"What is the company's email address?",ph:"info@example.com",fmt:"email",explain:"Use an email address that is monitored for official notifications."},
        {k:"capital",label:"Nominal capital",q:"What is the company's proposed nominal capital in kwacha?",ph:"50000",fmt:"num",explain:"Form 3 asks for nominal capital. Check PACRA's current prescribed minimum before filing."},
        {k:"shareClass",label:"Class of shares",q:"What class of shares will the company issue?",opts:["Ordinary","Preferential","Other","Not applicable – guarantee company"],explain:"Form 3 lists ordinary, preferential or other share classes. This may not apply to companies limited by guarantee."},
        {k:"shareOther",label:"Other share class",q:"If you selected Other, specify the share class. Otherwise say not applicable.",ph:"Not applicable",req:false,explain:"Only needed when the class of shares is Other."},
        {k:"shares",label:"Number of shares",q:"How many shares will the company issue? If limited by guarantee, say not applicable.",ph:"1000",req:false,explain:"Form 3 requests the number of shares for share companies. It is not applicable to companies limited by guarantee."},
        {k:"parValue",label:"Par value",q:"What is the par value per share? If not applicable, say so.",ph:"K1",req:false,explain:"Enter the par value stated in the proposed share structure, where applicable."},
        {k:"yearEnd",label:"Financial year end",q:"What date will the company's financial year end?",ph:"31 December",explain:"Form 3 says the first financial year end must not be more than 12 months after incorporation."},
        {k:"foreignInvestment",label:"Foreign pledged investment",q:"Are there foreign investors with a pledged investment? If yes, state amount and period; otherwise say none.",ph:"None / USD 20,000 over 12 months",req:false,explain:"Form 3 requests the pledged investment amount and period in the case of foreign investors."},
        {k:"directorName",label:"First director full name",q:"Let's add the first director. What is their full name?",ph:"First and surname",fmt:"title",explain:"Form 3 requires particulars and consent for each first director."},
        {k:"directorGender",label:"Director gender",q:"What is the first director's gender?",opts:["Female","Male","Prefer not to say"],explain:"This is a personal detail requested in the director particulars section."},
        {k:"directorDob",label:"Director date of birth",q:"What is the director's date of birth?",ph:"5 March 1990",fmt:"date",explain:"Enter the date of birth as shown on their identification."},
        {k:"directorNationality",label:"Director nationality",q:"What is the director's nationality?",ph:"Zambian",fmt:"title",explain:"Enter the director's nationality."},
        {k:"directorId",label:"Director identity",q:"What identity document type and number does the director use?",ph:"NRC 123456/78/1",explain:"Form 3 lists NRC for Zambians and NRC, passport, driver's licence or resident permit for non-Zambians."},
        {k:"directorContact",label:"Director contact",q:"What are the director's mobile number and email address?",ph:"+260 977 123 456, name@example.com",explain:"Provide contact details for the director."},
        {k:"directorAddress",label:"Director address",q:"What is the director's physical address, including town, province and country?",ph:"Plot 12, Riverside, Kitwe, Copperbelt, Zambia",explain:"Form 3 asks for the director's physical address."},
        {k:"directorConsent",label:"Director consent",q:"Has the first director agreed to act and provide a signature and date for the consent declaration?",opts:["Yes – consent confirmed","Not yet confirmed"],explain:"The form contains a declaration of consent to act as director. The actual signature and date must be completed by the director."},
        {k:"directorCount",label:"Number of directors",q:"How many first directors will the company appoint in total?",opts:["2","3","4","5 or more"],explain:"Form 3 notes a minimum of two directors for private companies and three for public limited companies. At least half must be resident in Zambia."},
        {k:"secondDirector",label:"Additional director",q:"If there is another director, give their full name and nationality. Otherwise say not applicable.",ph:"Full name, Zambian",req:false,explain:"Form 3 allows the director particulars section to be replicated for additional directors."},
        {k:"secondDirectorId",label:"Additional director identity",q:"Give the additional director's date of birth and identity type and number, or say not applicable.",ph:"5 March 1990; NRC 123456/78/1",req:false,explain:"Each additional director needs their own identity particulars."},
        {k:"secondDirectorContact",label:"Additional director contact",q:"Give the additional director's phone, email and physical address, or say not applicable.",ph:"Phone, email, address and town",req:false,explain:"Each additional director needs separate contact and address details."},
        {k:"residentDirectors",label:"Zambia-resident directors",q:"How many of the appointed directors will be resident in Zambia?",ph:"2",explain:"Form 3 states that the number of directors resident in Zambia must not be less than half the number appointed."},
        {k:"shareholderName",label:"Shareholder details",q:"Who will be the first shareholder? You may say same as first director if that is the case, or not applicable for a guarantee company.",ph:"Same as first director / full name / not applicable",req:false,explain:"Form 3 has a separate shareholder section. If one person holds both roles, we can reuse their personal particulars while keeping the role distinct."},
        {k:"shareholderDetails",label:"Shareholder particulars",q:"If the shareholder is not the first director, provide their gender, date of birth, nationality, identity number, phone, email and physical address. Otherwise say same as first director.",ph:"Gender, DOB, nationality, NRC/passport, phone, email and address",req:false,explain:"Part C requests personal identity, contact and physical-address particulars for each shareholder. Reuse director details only where the same person holds both roles."},
        {k:"shareholderHolding",label:"Shareholding",q:"How many shares and what class will this shareholder hold? Say not applicable for a guarantee company.",ph:"600 ordinary shares",req:false,explain:"Enter the shareholder's number and class of shares. Add further shareholders in the final review before filing."},
        {k:"beneficialOwner",label:"Beneficial owner",q:"Who is the beneficial owner? You may say same as shareholder if applicable, or not applicable where appropriate.",ph:"Same as shareholder / full name",req:false,explain:"Beneficial ownership is a separate Form 3 section. A beneficial owner is the natural person who ultimately owns or controls the company."},
        {k:"beneficialIdentity",label:"Beneficial owner particulars",q:"If the beneficial owner is not the shareholder already described, provide their gender, date of birth, nationality, identity number, occupation, phone, email and address. Otherwise say same as shareholder.",ph:"Personal and contact particulars",req:false,explain:"Part D requests the beneficial owner's personal, identity, occupation, contact and physical or registered-office address particulars."},
        {k:"beneficialDetails",label:"Beneficial ownership details",q:"What is the beneficial owner's occupation and nature of interest or control?",ph:"Businessperson; owns 60% of shares",explain:"Form 3 requests occupation and details explaining how ownership, control or economic interest is maintained."},
        {k:"beneficialAcquired",label:"Date beneficial interest acquired",q:"When was the beneficial interest acquired? If not yet known, say to be confirmed.",ph:"1 January 2026",req:false,explain:"Form 3 asks for the date when the beneficial interest was acquired."},
        {k:"beneficialPep",label:"Politically exposed person",q:"Is the beneficial owner a politically exposed person (PEP)? If yes, state the position held; otherwise say no.",ph:"No / Yes – position held",req:false,explain:"Form 3 asks for PEP details where applicable."},
        {k:"corporateOwner",label:"Corporate ownership",q:"Is any shareholder or beneficial owner a body corporate such as a company, cooperative, trust or society?",opts:["No","Yes","Not sure"],explain:"Where an applicant is a body corporate, Form 3 asks for its name, nature, registration number, date and country of incorporation, and relevant people behind it."},
        {k:"corporateDetails",label:"Body corporate details",q:"If yes, provide the body corporate name, nature, registration number, incorporation date and country. Otherwise say not applicable.",ph:"Company name, registration no., date and country",req:false,explain:"This captures the corporate-entity particulars requested in the shareholder and beneficial ownership sections."},
        {k:"guarantor",label:"Guarantors",q:"Is this a company limited by guarantee? If yes, provide the first guarantor's full name and identity details; otherwise say not applicable.",ph:"Name, nationality and identity number",req:false,explain:"Part E applies only to companies limited by guarantee and can be replicated for additional guarantors."},
        {k:"guarantorDetails",label:"Guarantor contact and address",q:"If applicable, provide the guarantor's date of birth, nationality, phone, email and physical address. Otherwise say not applicable.",ph:"DOB, nationality, phone, email and address",req:false,explain:"Part E requests guarantor identity, contact and address particulars."},
        {k:"guaranteedAmount",label:"Guaranteed amount",q:"If this is a company limited by guarantee, what amount will the guarantor undertake to contribute? Otherwise say not applicable.",ph:"K500",req:false,explain:"Form 3 asks for each guarantor's guaranteed amount and a signed declaration."},
        {k:"guarantorDeclaration",label:"Guarantor declaration",q:"Has the guarantor agreed to sign and date the undertaking to contribute? Otherwise say not applicable.",opts:["Yes – signature and date arranged","Not yet","Not applicable"],explain:"Part E contains a guarantor's declaration and signature/date fields."},
        {k:"secretary",label:"Company secretary",q:"Who will be the company secretary? Include full name, or say to be confirmed.",ph:"Full name",req:false,explain:"Form 3 includes company secretary particulars and consent to act. Confirm the eligibility and details before filing."},
        {k:"secretaryId",label:"Secretary identity",q:"What are the secretary's nationality, date of birth and identity type and number?",ph:"Zambian, date of birth, NRC number",req:false,explain:"Part F requests the secretary's personal and identity particulars."},
        {k:"secretaryContact",label:"Secretary contact",q:"What are the secretary's phone, email and physical address?",ph:"Phone, email, address, town and province",req:false,explain:"Part F requests phone, email and physical address, plus consent to act."},
        {k:"lodger",label:"Person lodging application",q:"Who will lodge the application? Provide their full name.",ph:"Full name",fmt:"title",explain:"Part H records the person lodging the application, their identity, contact and address details."},
        {k:"lodgerId",label:"Lodger identity and contact",q:"What is the lodger's identity document number, phone and email?",ph:"NRC, +260 number, email",explain:"Part H asks for identity type and number, phone and email."},
        {k:"lodgerAddress",label:"Lodger address",q:"What is the lodger's physical address, town and province?",ph:"Address, Kitwe, Copperbelt",explain:"Part H asks for the lodging person's physical address."},
        {k:"compliance",label:"Declaration of compliance",q:"Who will make the declaration of compliance: a legal practitioner, first director or first secretary?",opts:["Legal practitioner","First director","First secretary","To be confirmed"],explain:"Part G requires the declarant to state their qualifying role and confirm compliance. This declaration must be made and signed by the appropriate person."},
        {k:"complianceName",label:"Compliance declarant name",q:"What is the full name of the person making the declaration of compliance?",ph:"Full name",req:false,explain:"Part G includes the declarant's name and signature."},
        {k:"compliancePlaceDate",label:"Compliance declaration place and date",q:"Where and on what date will the declaration be signed?",ph:"Kitwe, 22 November 2026",req:false,explain:"Part G asks for the place and date of declaration. The declarant must sign the actual form."},
        {k:"lodgerSignatureDate",label:"Lodger signature and date",q:"Has the person lodging the application arranged to sign and date Part H?",opts:["Yes – signature and date arranged","Not yet"],explain:"Part H includes the lodger's signature and date. The actual signature must be completed on the official form."}
      ],
      build(d) {
        const rows = [["Company type",d.companyType],["Category",d.category + (d.categoryOther && d.categoryOther !== "Not applicable" ? ": "+d.categoryOther : "")],["Approved name",d.name],["Principal activity",d.activity],["Other activities",d.otherActivities],["Articles restrict business",d.restrict],["Articles",d.articles],["Registered office",[d.physicalPlot,d.physicalStreet,d.physicalArea,d.town,d.province].filter(Boolean).join(", ")],["Postal address",d.postal],["Company phone",d.phone],["Landline",d.landline],["Email",d.email],["Nominal capital",d.capital],["Share class",d.shareClass],["Other share class",d.shareOther],["Number of shares",d.shares],["Par value",d.parValue],["Financial year end",d.yearEnd],["Foreign pledged investment",d.foreignInvestment],["First director",d.directorName],["Director gender / DOB",[d.directorGender,d.directorDob].filter(Boolean).join(" / ")],["Director nationality / ID",[d.directorNationality,d.directorId].filter(Boolean).join(" / ")],["Director contact",d.directorContact],["Director address",d.directorAddress],["Director consent",d.directorConsent],["Number of directors",d.directorCount],["Additional director",d.secondDirector],["Additional director ID",d.secondDirectorId],["Additional director contact",d.secondDirectorContact],["Directors resident in Zambia",d.residentDirectors],["Shareholder",d.shareholderName],["Shareholder particulars",d.shareholderDetails],["Shareholding",d.shareholderHolding],["Beneficial owner",d.beneficialOwner],["Beneficial owner particulars",d.beneficialIdentity],["Beneficial interest",d.beneficialDetails],["Interest acquired",d.beneficialAcquired],["PEP details",d.beneficialPep],["Corporate owner",d.corporateOwner],["Corporate details",d.corporateDetails],["Guarantor",d.guarantor],["Guarantor contact / address",d.guarantorDetails],["Guaranteed amount",d.guaranteedAmount],["Guarantor declaration",d.guarantorDeclaration],["Company secretary",d.secretary],["Secretary identity",d.secretaryId],["Secretary contact",d.secretaryContact],["Person lodging application",d.lodger],["Lodger identity / contact",d.lodgerId],["Lodger address",d.lodgerAddress],["Compliance declarant",d.compliance],["Declarant name",d.complianceName],["Declaration place / date",d.compliancePlaceDate],["Lodger signature / date",d.lodgerSignatureDate]];
        return {badge:"PACRA Form 3 preparation",head:"Your company incorporation information is organised",main:d.name,tagline:"Application for Incorporation · Form 3",summary:"This is a preparation record structured around the eight parts of PACRA Form 3. Review every field, add any additional directors, shareholders and beneficial owners, and complete all required signatures and declarations before filing.",rows,fine:"Preparation only — not a PACRA filing, incorporation certificate or legal confirmation. Form 3 provides repeatable sections for additional directors, shareholders, beneficial owners, guarantors and secretaries. This guided demo captures a first set of details; verify completeness and current PACRA requirements before submission.",speak:[`I have organised the information for ${d.name} in the structure of PACRA Form 3.`,`This is a preparation record, not a filing or approval.`]};
      }
    },
    tpin: {
      key: "tpin", title: "Register a TPIN", opener: "Let's get your TPIN set up.",
      steps: [
        {k:"type", label:"Taxpayer type", q:"Who is the TPIN for?", opts:["Individual","Sole trader","Company"], alias:{"Individual":["myself","me","person","personal"],"Sole trader":["sole","trader"],"Company":["business","firm","limited"]}, explain:"Individual: you personally, for example if you are employed. Sole trader: you run a business in your own name. Company: a registered limited company."},
        {k:"name", label:"Name", q:"What is the full name or company name?", ph:"John Mwila", fmt:"title", explain:"Your full name as it appears on your NRC, or the company's name for a company."},
        {k:"nrc", label:"NRC", q:"What is your NRC number?", hint:"For a company, use a director's NRC.", ph:"123456/78/1", fmt:"nrc", explain:"NRC is the National Registration Card. The number has 9 digits, written like 123456/78/1."},
        {k:"dob", label:"Date of birth", q:"What is your date of birth?", hint:"For example, 5 March 1990.", fmt:"date", kw:["birthday","birth"], explain:"Your date of birth as it appears on your NRC. For a company, use the owner's."},
        {k:"phone", label:"Phone", q:"What is your phone number?", ph:"0977 123 456", fmt:"tel", kw:["mobile","cell"], explain:"A number where ZRA can reach you. Use one you answer."},
        {k:"email", label:"Email", q:"What is your email address?", ph:"name@example.com", fmt:"email", kw:["mail"], explain:"Your TPIN details and updates are usually sent here."},
        {k:"province", label:"Province", q:"Which province do you live in?", opts:PROVINCES, explain:"Zambia has 10 provinces. Choose the one where you live or where your business is based."},
        {k:"address", label:"Address", q:"What is your physical address?", ph:"Plot 5, Cairo Road, Lusaka", kw:["location"], explain:"Where you live or where the business is based: plot number, street and town."},
        {k:"income", label:"Main income", q:"What is your main source of income?", opts:["Employment","Business","Farming","Rent","Other"], alias:{"Employment":["job","salary","employed","work"],"Business":["trading","self employed"],"Farming":["farm","agriculture"],"Rent":["rental","property"]}, explain:"This tells ZRA what kind of tax may apply to you, such as salary tax, business profits, farming income or rent."},
        {k:"pacra", label:"PACRA no.", q:"Do you have a PACRA number?", hint:"Say “skip” if you do not.", ph:"BN-2026-123456", req:false, explain:"PACRA is where businesses are registered. If your business is registered, the number is on its certificate. If not, just skip."},
        {k:"businessActivity",label:"Business activity",q:"If this TPIN is for a business, what does the business do? Otherwise say not applicable.",ph:"Retail sale of hardware",req:false,explain:"A brief description of the business activity helps identify the taxpayer's activity."},
        {k:"regNumber",label:"Registration number",q:"If the business is registered, what is its PACRA registration number? Otherwise say not applicable.",ph:"PACRA registration number",req:false,explain:"Use the registration number shown on the PACRA certificate, where relevant."},
        {k:"taxCategory",label:"Tax category",q:"Which tax or taxpayer category are you asking about? If unsure, say not sure.",opts:["Income tax","PAYE","Withholding tax","VAT","Turnover tax","Not sure / need guidance"],explain:"This is a preparation question only. ZRA determines the correct tax obligations based on current law and the taxpayer's circumstances."},
        {k:"employees",label:"Employees",q:"Does the business employ staff? If yes, approximately how many?",ph:"No / 3 employees",req:false,explain:"Employee information may be relevant to PAYE and other employer obligations."},
        {k:"turnover",label:"Estimated turnover",q:"What is the approximate annual business turnover in kwacha, if known?",ph:"K120000",fmt:"num",req:false,explain:"An estimate can help guide further questions, but ZRA tax thresholds and rules must be checked against current guidance."},
        {k:"taxSource",label:"Other income sources",q:"Do you receive any other income, such as rent, farming or employment?",ph:"Salary and rental income",req:false,explain:"Mention other income sources so the correct taxpayer questions can be considered."},
        {k:"bank",label:"Banking details",q:"Does the taxpayer or business have a bank account? You do not need to share account numbers here.",opts:["Yes","No","Prefer not to say"],explain:"This is a general preparation question. Do not share bank account numbers or passwords in this demo."},
        {k:"docs",label:"Documents ready",q:"Which supporting documents do you already have?",ph:"NRC, PACRA certificate, proof of address",req:false,explain:"List the documents you have available. Confirm the current ZRA checklist before applying."},
        {k:"assistance",label:"Help needed",q:"What would you most like help understanding about TPIN registration or tax?",ph:"How to register a company for TPIN",req:false,explain:"This helps tailor the next explanation to the user's actual need."}
      ],
      build(d) {
        const raw = "10" + rnd(8), tpin = `${raw.slice(0,4)} ${raw.slice(4,7)} ${raw.slice(7)}`;
        return {
          badge: "TPIN issued", head: "Your TPIN is created", main: tpin, tagline: "Taxpayer Identification Number",
          rows: [["Taxpayer", d.name], ["Taxpayer type", d.type], ["NRC", d.nrc], ["Date of birth", d.dob], ["Main income", d.income], ["Phone", d.phone], ["Email", d.email], ["Province", d.province], ["Address", d.address], ["PACRA no.", d.pacra], ["Business activity",d.businessActivity],["Registration number",d.regNumber],["Tax category of interest",d.taxCategory],["Employees",d.employees],["Estimated turnover",d.turnover],["Other income",d.taxSource],["Bank account",d.bank],["Documents ready",d.docs],["Help requested",d.assistance], ["Date issued", today()], ["Status", "Active (demo)"]],
          fine: "Demo only. This number is made up. It is not a real ZRA TPIN. Do not use it for any official purpose.",
          speak: [`Congratulations ${d.name}. Your T P I N is created.`, `Your T P I N is ${spaced(raw)}.`, `Taxpayer type: ${d.type}.`, "This is a demo. It is not a real Z R A T P I N."]
        };
      }
    },
    profile: {
      key: "profile", title: "Create a business profile", opener: "Let's create your business profile.",
      steps: [
        {k:"name", label:"Business name", q:"What would you like to call this business? If you have no name yet, tell me the idea and I can suggest names.", ph:"Mwila Fresh Foods", fmt:"title", explain:"The name your customers know your business by. You can use a working name for now."},
        {k:"what", label:"What it does", q:"Tell me your business idea in your own words. Even a short description is enough.", hint:"I will help develop it into a clear concept.", ph:"I want to sell affordable meals to workers", explain:"Describe the problem you want to solve or the product or service you want to offer."},
        {k:"industry", label:"Industry", q:"Which industry best fits your idea?", opts:["Food & hospitality","Technology","Construction","Retail & fashion","Agriculture","Transport & logistics","Beauty & personal care","Professional services","Manufacturing","Other"], alias:{"Retail & fashion":["retail","shop","shopping","selling","clothing"],"Food & hospitality":["food","restaurant","drink","drinks","catering"],"Agriculture":["farming","farm","agri"],"Technology":["tech","software","AI","computer"],"Construction":["building","hardware","pavers"]}, explain:"Choose the closest industry. I can suggest business models and ideas within it."},
        {k:"customers", label:"Customers", q:"Who are your customers?", ph:"Families and local shops", explain:"The people or businesses that buy from you."},
        {k:"town", label:"Town", q:"Which town or city are you in?", ph:"Kitwe", fmt:"title", explain:"Where your business operates from."},
        {k:"team", label:"Team size", q:"How many people work there?", opts:["Just me","Small (2–5)","Medium (6–20)","Large (21+)"], alias:{"Just me":["alone","myself","only me","one"],"Small (2–5)":["small","2 to 5","two to five"],"Medium (6–20)":["medium","6 to 20","six to twenty"],"Large (21+)":["large","big","21 or more","more than twenty"]}, explain:"Count yourself and everyone who works with you, including family helpers."},
        {k:"stage", label:"Stage", q:"What stage are you at?", opts:["Idea","Just started","Already trading"], alias:{"Idea":["planning","thinking"],"Just started":["started","new","beginning"],"Already trading":["trading","running","operating","established"]}, explain:"Idea: not started yet. Just started: you have your first customers. Already trading: you sell regularly."},
        {k:"capital", label:"Startup capital", q:"How much startup money do you have, in kwacha?", ph:"20000", fmt:"num", kw:["money","budget","capital"], explain:"The money you have to start or run the business. A rough figure is fine."},
        {k:"goal", label:"12-month goal", q:"What is your main goal for the next 12 months?", ph:"Open a second shop", explain:"The one thing you most want to achieve in the next year."},
        {k:"contact", label:"Contact", q:"What is the best phone number or email?", ph:"0977 123 456 or name@example.com", fmt:"contact", kw:["phone","email"], explain:"How customers or partners should reach you."},
        {k:"problem",label:"Customer problem",q:"What need or problem will your business solve?",ph:"Affordable lunch for busy workers",explain:"A strong business solves a real customer need."},
        {k:"offer",label:"Products or services",q:"What products or services will you offer first?",ph:"Lunch packs, drinks and delivery",explain:"Start with the first products or services you can realistically provide."},
        {k:"competition",label:"Competitors",q:"Who else offers something similar in your area?",ph:"Nearby takeaways and market vendors",req:false,explain:"Knowing alternatives helps you identify what will make your offer different."},
        {k:"difference",label:"Competitive advantage",q:"Why might customers choose you instead?",ph:"Convenient ordering and consistent quality",explain:"This could be price, convenience, quality, location, speed or a specialised offer."},
        {k:"pricing",label:"Pricing",q:"How do you plan to price your products or services?",ph:"K50 per meal",req:false,explain:"A starting price or pricing approach helps estimate revenue. It should later be checked against costs and customer demand."},
        {k:"resources",label:"Resources",q:"What equipment, stock, skills or premises will you need?",ph:"Cooking equipment, ingredients and packaging",req:false,explain:"List the main resources needed to begin operating."},
        {k:"funding",label:"Funding source",q:"Where will the startup capital come from?",opts:["Personal savings","Family or friends","Loan","Investor","Grant or support programme","Combination","Not decided"],explain:"This helps explain how the startup will be funded."},
        {k:"milestone",label:"First milestone",q:"What would success look like in the first three months?",ph:"Get 30 regular customers",explain:"Choose a practical first milestone that can be measured."},
        {k:"salesChannel",label:"Sales channel",q:"How will customers buy from you: in person, online, delivery, wholesale or a mix?",ph:"Shop and WhatsApp orders",explain:"The sales channel describes how customers find and purchase your offer."},
        {k:"supplier",label:"Suppliers",q:"Where do you expect to source stock, ingredients or materials?",ph:"Local wholesalers in Kitwe",req:false,explain:"Identify likely suppliers and compare quality, prices and reliability before committing."},
        {k:"marketing",label:"Marketing",q:"How will people hear about the business?",ph:"WhatsApp, Facebook and referrals",explain:"Choose realistic channels that reach your intended customers."},
        {k:"monthlyCosts",label:"Monthly costs",q:"What ongoing costs do you expect each month? Give a rough total or say not sure.",ph:"Rent, data, transport and wages",req:false,explain:"Recurring costs may include rent, utilities, wages, data, transport and restocking."},
        {k:"salesEstimate",label:"Sales estimate",q:"How many sales or customers do you hope to serve in a typical month?",ph:"100 orders per month",req:false,explain:"This is a planning target, not a guaranteed sales forecast."},
        {k:"licenses",label:"Licences and permits",q:"Do you know which licences or permits may apply to this business?",ph:"Council trading licence, food health approvals",req:false,explain:"Requirements depend on the activity and location. Verify with the relevant local authority and regulator."},
        {k:"risks",label:"Main risks",q:"What could make this business difficult to run?",ph:"Supplier prices, competition, seasonal demand",req:false,explain:"Identifying risks early helps you prepare practical ways to reduce them."},
        {k:"support",label:"Support needed",q:"What support would help you most: training, equipment, funding, premises or mentorship?",opts:["Training","Equipment","Funding","Premises","Mentorship","Several of these","Not sure"],explain:"This helps identify the next resources to seek. GOVAI does not guarantee grants or loans."},
        {k:"nextSteps",label:"Immediate next step",q:"What is the first practical action you can take this week?",ph:"Compare suppliers and test demand",explain:"A small, testable action helps move the idea forward before making large investments."}
      ],
      build(d) {
        const summary = `${d.name} is a ${String(d.industry).toLowerCase()} business based in ${d.town}. Business concept: ${d.what}. Intended customers: ${d.customers}. Proposed startup capital: ${d.capital || "to be confirmed"}.`;
        const capital = Number(String(d.capital || "").replace(/[^0-9]/g,""));
        const budgetRows = capital > 0 ? [["Suggested stock / equipment",Math.round(capital*.45)],["Setup / premises",Math.round(capital*.20)],["Marketing",Math.round(capital*.10)],["Transport / logistics",Math.round(capital*.10)],["Working capital reserve",capital-Math.round(capital*.45)-Math.round(capital*.20)-Math.round(capital*.10)-Math.round(capital*.10)]].map(x=>[x[0],"K"+x[1].toLocaleString("en-US")]) : [];
        return {
          badge: "Business profile created", head: "Your business profile is created", main: d.name, tagline: `${d.industry} · ${d.town}`, summary,
          rows: [["What it does", d.what], ["Industry", d.industry], ["Customer problem", d.problem], ["Products / services", d.offer], ["Target customers", d.customers], ["Location", d.town], ["Team size", d.team], ["Stage", d.stage], ["Startup capital", d.capital], ...budgetRows.map(r=>["Draft budget · "+r[0],r[1]]), ["Funding source", d.funding], ["Competitors", d.competition], ["Competitive advantage", d.difference], ["Pricing approach", d.pricing], ["Resources required", d.resources], ["12-month goal", d.goal], ["First 3-month milestone", d.milestone], ["Sales channel",d.salesChannel],["Potential suppliers",d.supplier],["Marketing approach",d.marketing],["Estimated monthly costs",d.monthlyCosts],["Sales target",d.salesEstimate],["Licences to verify",d.licenses],["Main risks",d.risks],["Support needed",d.support],["Immediate next step",d.nextSteps], ["Contact", d.contact], ["Created", today()]],
          fine: "Planning document only. Estimates and recommendations must be validated locally; no funding, revenue or business success is guaranteed. This is not an official registration or licence.",
          speak: [`Done. Your business profile for ${d.name} is created.`, summary, `Stage: ${d.stage}. Goal: ${d.goal}.`, "This is a demo profile."]
        };
      }
    }
  };
  /* GOVAI 2.0 demo scope: concise 10-step flows and a clearly labelled sample name directory. */
  const SAMPLE_TAKEN_NAMES = [
    "MTN Zambia","Airtel Zambia","Zamtel","Zanaco","Stanbic Bank Zambia","Absa Bank Zambia","Standard Chartered Zambia","FNB Zambia","Indo Zambia Bank","Access Bank Zambia",
    "Shoprite Zambia","Pick n Pay Zambia","Game Stores Zambia","Choppies Zambia","Hungry Lion Zambia","KFC Zambia","Pizza Hut Zambia","Domino's Pizza Zambia","Coca-Cola Beverages Zambia","Trade Kings Zambia",
    "Zambeef Products","Zambia Sugar","Zambia Breweries","National Breweries","Mopani Copper Mines","Konkola Copper Mines","First Quantum Minerals","Kansanshi Mining","Barrick Lumwana","ZCCM Investments Holdings",
    "CEC Zambia","ZESCO","Lafarge Zambia","Dangote Cement Zambia","Puma Energy Zambia","TotalEnergies Zambia","Oryx Energies Zambia","Toyota Zambia","BongoHive","Madison General Insurance",
    "Professional Insurance Corporation Zambia","ZSIC General Insurance","Mukuba Pension Trustees","Zambia National Commercial Bank","Cavmont Bank","Atlas Mara Zambia","Airtel Money Zambia","MTN Mobile Money Zambia","Jumia Zambia","CFAO Motors Zambia"
  ];
  FLOWS.business.title = "Business name and registration preparation";
  FLOWS.business.opener = "Let's check your proposed business name and prepare the next registration steps.";
  FLOWS.business.steps = [
    {k:"name",label:"Proposed business name",q:"What name would you like to use for your business or company?",ph:"Hardware Stores Limited",fmt:"title",explain:"Enter the name you want to use. This demo checks it against a small sample directory, not PACRA's live register."},
    {k:"activity",label:"Business activity",q:"What will the business mainly do?",ph:"Retail sale of hardware and building materials",explain:"A short description of the main product or service."},
    {k:"companyType",label:"Business structure",q:"How would you like to register?",opts:["Private company limited by shares","Business name / sole trader","Partnership","Not sure – help me choose"],explain:"A limited company is a separate legal entity. A business name or sole trader is generally a simpler structure. Confirm the right structure with PACRA."},
    {k:"owner",label:"Applicant or owner",q:"What is your full name?",ph:"First name and surname",fmt:"title",explain:"The name of the person making this registration enquiry."},
    {k:"phone",label:"Phone number",q:"What phone number can be used to contact you?",ph:"+260 977 123 456",fmt:"tel",explain:"Use a number you can access."},
    {k:"email",label:"Email address",q:"What is your email address?",ph:"you@example.com",fmt:"email",explain:"Use an email address you check regularly."},
    {k:"town",label:"Town",q:"In which town will the business operate?",ph:"Kitwe",fmt:"title",explain:"The town where the business will mainly operate."},
    {k:"address",label:"Business address",q:"What is the business or proposed office address?",ph:"Area, street and town",explain:"A general address is enough for this demo. Official registration may require more detail."},
    {k:"capital",label:"Starting capital",q:"Approximately how much capital are you starting with, in kwacha?",ph:"5000",fmt:"num",req:false,explain:"A rough estimate is fine. It is not a PACRA fee or prescribed capital amount."},
    {k:"confirm",label:"Confirmation",q:"Would you like me to prepare your business registration summary using these details?",opts:["Yes – prepare my summary","I want to change something"],explain:"Review the summary before using it. This demo does not reserve a name or submit an application."}
  ];
  FLOWS.business.build = function(d) {
    return {badge:"Business registration preparation",head:"Your registration preparation summary is ready",main:d.name,tagline:"Proposed name · Demo screening",summary:`${d.name} is a proposed ${d.companyType} operating in ${d.town}. Its main activity is ${d.activity}.`,rows:[["Proposed name",d.name],["Name screening", "No match found in GOVAI's sample list (not a PACRA availability result)"],["Business activity",d.activity],["Business structure",d.companyType],["Applicant",d.owner],["Phone",d.phone],["Email",d.email],["Town",d.town],["Address",d.address],["Starting capital",d.capital ? `K${d.capital}` : "To be confirmed"]],fine:"DEMO ONLY. The sample name directory is not PACRA's official register and cannot confirm legal availability. No name has been reserved, no fee has been paid and no application has been submitted. Final name clearance and registration remain subject to PACRA's official process.",speak:[`Your preparation summary for ${d.name} is ready.`,`The name was not found in the GOVAI sample list. This is not an official PACRA availability check.`]};
  };
  FLOWS.tpin.title = "ZRA TPIN preparation";
  FLOWS.tpin.opener = "Let's prepare the information you may need for a ZRA TPIN application.";
  FLOWS.tpin.steps = FLOWS.tpin.steps.slice(0,10);
  FLOWS.tpin.build = function(d) { return {badge:"TPIN preparation",head:"Your TPIN preparation summary is ready",main:d.name,tagline:"ZRA taxpayer registration · Demo",summary:`This preparation record is for ${d.name}, recorded as ${d.type}.`,rows:[["Taxpayer",d.name],["Taxpayer type",d.type],["NRC",d.nrc],["Date of birth",d.dob],["Phone",d.phone],["Email",d.email],["Province",d.province],["Address",d.address],["Main income",d.income],["PACRA number",d.pacra]],fine:"DEMO ONLY. GOVAI has not registered you with ZRA and has not generated or issued a TPIN. Do not treat this summary as an official tax registration.",speak:[`Your TPIN preparation summary for ${d.name} is ready. This is not a TPIN.`]}; };
  FLOWS.profile.title = "Create a business profile";
  FLOWS.profile.opener = "Let's turn your idea into a clear business profile.";
  FLOWS.profile.steps = FLOWS.profile.steps.slice(0,10);
  const START_CHIPS = ["Register a business", "Register a TPIN", "Create a business profile"];


  /* ---------- Plain-language answers to side questions ---------- */
  const FAQ = [
    [/\bpacra\b/, "PACRA is the Patents and Companies Registration Agency. It registers business names and companies in Zambia."],
    [/\bzra\b/, "ZRA is the Zambia Revenue Authority. It collects taxes and issues TPINs."],
    [/\btpin\b/, "A TPIN is a Taxpayer Identification Number from the Zambia Revenue Authority. It identifies you for tax, so you usually need it to file returns or pay tax."],
    [/\bnrc\b|national registration/, "NRC is the National Registration Card. The number has 9 digits, written like 123456/78/1."],
    [/\b(provinces?)\b/, "Zambia has 10 provinces: Central, Copperbelt, Eastern, Luapula, Lusaka, Muchinga, Northern, North-Western, Southern and Western."],
    [/\b(sole trader|partnership|limited company|difference)\b/, "Sole trader: you own the business alone. Partnership: two or more people share it. Limited company: a separate legal entity owned by shareholders."],
    [/\b(cost|fees?|price|charge|how much (does|is|do|will))\b/, "Fees are set by the agency and can change, so I cannot quote them here. This demo is free. Check with the agency before you apply."],
    [/\b(how long|how fast|how many days|when will)\b/, "In real life, timing depends on the agency. This demo takes about two minutes."],
    [/\b(documents?|bring|required|requirements?|what do i need)\b/, "In real life you usually need your NRC and your contact details. In this demo, I only need your answers."],
    [/\b(real|official|genuine|legit|fake|is this (a )?(demo|test))\b/, "This is a demo. It practises the steps and makes a sample result. Nothing is sent to PACRA or ZRA, and the numbers are made up."],
    [/\b(save|saved|stored?|private|safe|privacy|my data|who (sees|can see))\b/, "Your answers stay on this device, in your browser. Nothing is sent anywhere."],
    [/\b(shareholder|shares?)\b/, "A shareholder owns shares in a company. Form 3 records the shareholder's identity and the number and class of shares held."],
    [/\b(beneficial owner|beneficial ownership)\b/, "A beneficial owner is the natural person who ultimately owns or controls a company, even where ownership is held through another entity or arrangement."],
    [/\b(director)\b/, "A director is appointed to manage or oversee the company. Form 3 asks for each first director's identity, contact and address details, plus consent to act."],
    [/\b(nominal capital|share capital|capital)\b/, "Nominal capital is the stated share capital of a company. Form 3 notes that the amount must not be below the prescribed minimum, so confirm the current minimum with PACRA."],
    [/\b(articles|standard articles|non.standard)\b/, "Articles are the rules governing how a company is run. Form 3 asks whether standard or non-standard articles will be used and whether they restrict the nature of business."],
    [/\b(financial year|year end)\b/, "The financial year end is the date the company closes its accounting year. Form 3 says the first financial year end must be no more than 12 months from incorporation."],
    [/\b(isic|business activity classification)\b/, "ISIC is the International Standard Industrial Classification used to classify economic activities. Describe the main activity clearly and confirm the appropriate classification with PACRA."],
    [/\b(guarantor|guarantee company)\b/, "A guarantor undertakes to contribute the guaranteed amount if the company is wound up, subject to the company's legal obligations. Form 3 Part E applies to companies limited by guarantee."],
    [/\b(pep|politically exposed)\b/, "A politically exposed person is someone entrusted with a prominent public function, as defined by applicable law. Form 3 asks for details where the beneficial owner is a PEP."],
    [/\b(resident director|resident in zambia)\b/, "Form 3 states that the number of directors resident in Zambia must not be less than half the number of directors appointed."],
    [/\b(registered office|physical address|postal address)\b/, "The registered office is the company's official physical address. The postal address is used for notifications. Form 3 requests both sets of details."]
  ];
  const EXPLAIN = new RegExp([
    "what does (that|this|it) mean", "what do you mean", "what does .{1,30} mean", "what is (that|this|it)\\b", "what('?s| is| are) (a|an|the|my|your|these) ", "^(please )?explain", "explain (that|this|it|more)",
    "meaning", "mean by", "why (do|are|is|does|did) (you|i|we|this|it|that)", "how (long|much|do i|does it|can i)", "i (don'?t|do not) (understand|know|get)", "not sure", "confus",
    "^help\\b", "help me", "^(any |an |give me |show me )?examples?\\b", "clarify", "elaborate", "^huh", "^pardon", "i'?m lost", "^what\\??$"
  ].join("|"), "i");
  const Q_START = /^(what|what'?s|whats|why|how|who|where|when|which|can you|could you|do i|does|is it|is this|are you|should i|will i)\b/;

  /* ---------- Value helpers (typed and spoken answers) ---------- */
  const NUM = {zero:0, oh:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9};
  const digitsOf = (t) => String(t).toLowerCase().replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g, (m) => NUM[m]).replace(/\D/g, "");
  const nz = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "");
  const clean = (raw) => String(raw).toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
  function fmtPhone(raw) {
    const plus = /^\s*(\+|plus)/i.test(raw), d = digitsOf(raw);
    if (plus && d.startsWith("260") && d.length === 12) return `+260 ${d.slice(3,6)} ${d.slice(6,9)} ${d.slice(9)}`;
    if (!plus && /^0\d{9}$/.test(d)) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
    return (plus ? "+" : "") + d;
  }
  function fmtEmail(raw) {
    let t = String(raw).trim().toLowerCase();
    if (!t.includes("@")) t = t.replace(/\s+at\s+/g, "@").replace(/\s+dot\s+/g, ".").replace(/\s+underscore\s+/g, "_").replace(/\s+(dash|hyphen)\s+/g, "-");
    return t.replace(/\s+/g, "");
  }
  const ORD = ["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth","eleventh","twelfth","thirteenth","fourteenth","fifteenth","sixteenth","seventeenth","eighteenth","nineteenth"];
  function ordinalWords(t) {
    let x = String(t).toLowerCase();
    x = x.replace(/\b(twenty|thirty)[\s-](first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)\b/g, (m, a, b) => (a === "twenty" ? 20 : 30) + ORD.indexOf(b) + 1);
    x = x.replace(/\btwentieth\b/g, "20").replace(/\bthirtieth\b/g, "30");
    ORD.forEach((w, i) => { x = x.replace(new RegExp("\\b" + w + "\\b", "g"), String(i + 1)); });
    return x;
  }
  function fmtDate(raw) {
    const t = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const ms = Date.parse(ordinalWords(t).replace(/(\d)(st|nd|rd|th)\b/gi, "$1").replace(/\bof\b/gi, "").replace(/\s+/g, " "));
    if (isNaN(ms)) return t;
    const d = new Date(ms), p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  function norm(s, v) {
    v = String(v == null ? "" : v).trim();
    // Voice-friendly answer extraction: remove conversational lead-ins while preserving the actual answer.
    const leadIns = [
      /^my business name is\s+/i, /^the business name is\s+/i, /^the company name is\s+/i,
      /^my name is\s+/i, /^i am called\s+/i, /^we are called\s+/i,
      /^my business is called\s+/i, /^the business is called\s+/i,
      /^i am in\s+/i, /^we are in\s+/i, /^the town is\s+/i,
      /^my business does\s+/i, /^the business does\s+/i, /^we sell\s+/i, /^i sell\s+/i
    ];
    if (s.k === "name" || s.k === "lodger" || s.k === "directorName") leadIns.slice(0,7).forEach(re => { v=v.replace(re,""); });
    if (s.k === "town" || s.k === "province") [leadIns[8],leadIns[9],leadIns[10]].forEach(re => {v=v.replace(re,"");});
    if (s.k === "what" || s.k === "activity") [leadIns[11],leadIns[12],leadIns[13],leadIns[14]].forEach(re => {v=v.replace(re,"");});
    v = v.trim();
    if (!v) return "";
    switch (s.fmt) {
      case "tel": return fmtPhone(v);
      case "email": return fmtEmail(v);
      case "date": return fmtDate(v);
      case "nrc": { const d = digitsOf(v); return d.length === 9 ? `${d.slice(0,6)}/${d.slice(6,8)}/${d.slice(8)}` : v; }
      case "num": {
        let t = v.toLowerCase().replace(/,/g, "");
        t = t.replace(/(\d+(?:\.\d+)?)\s*thousand/, (_, n) => n * 1000).replace(/(\d+(?:\.\d+)?)\s*million/, (_, n) => n * 1000000);
        return digitsOf(t.replace(/\.\d+/, ""));
      }
      case "contact": return (/@|\bat\b.+\bdot\b/i.test(v)) ? fmtEmail(v) : fmtPhone(v);
      case "title": return v.replace(/\.$/, "").replace(/\s+/g, " ").replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());
      default: return v.replace(/\.$/, "").replace(/^[a-z]/, (c) => c.toUpperCase());
    }
  }
  function check(s, v) {
    if (!v) return s.req === false ? "" : "Please answer this question.";
    if (s.opts) return "";
    switch (s.fmt) {
      case "tel": { const n = digitsOf(v).length; if (n < 9 || n > 13) return "That does not look like a phone number."; break; }
      case "email": if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "That does not look like an email address."; break;
      case "nrc": if (!/^\d{6}\/\d{2}\/\d$/.test(v)) return "That does not look like an NRC number. It has 9 digits, like 123456/78/1."; break;
      case "date": { const t = Date.parse(v); if (isNaN(t) || t > Date.now() || new Date(t).getFullYear() < 1900) return "I could not read that date. Try “5 March 1990”."; break; }
      case "num": if (!(Number(v) > 0)) return "Please give an amount above zero, like 20000."; break;
      case "contact": if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || (digitsOf(v).length >= 9 && digitsOf(v).length <= 13))) return "Please give a valid phone number or email."; break;
      default: if (v.length < 2) return "Please give a little more detail.";
    }
    return "";
  }
  function disp(s, v) {
    if (!v) return "—";
    if (s.fmt === "date") return longDate(v);
    if (s.fmt === "num") return "K" + Number(v).toLocaleString("en-US");
    return v;
  }
  function spoken(s, v) {
    if (!v) return "none";
    if (s.fmt === "tel" || s.fmt === "nrc") return String(v).replace(/\//g, " slash ").replace(/\d/g, "$& ").replace(/\s+/g, " ").trim();
    if (s.fmt === "email") return v.replace(/@/g, " at ").replace(/\./g, " dot ");
    if (s.fmt === "contact") return /@/.test(v) ? v.replace(/@/g, " at ").replace(/\./g, " dot ") : spaced(v);
    if (s.fmt === "date") return longDate(v);
    if (s.fmt === "num") return `${Number(v)} kwacha`;
    return v;
  }
  const wordsOf = (x) => " " + String(x).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() + " ";
  function matchOpt(s, said) {
    const W = wordsOf(said); if (W.trim() === "") return null;
    const names = (o) => [o, ...((s.alias || {})[o] || [])].map(wordsOf).filter((n) => n.trim());
    // 1) the spoken/typed text contains a whole option name or alias (whole words only)
    for (const o of s.opts) if (names(o).some((n) => W.includes(n))) return o;
    // 2) a single spoken word (4+ letters) equals a word of an option or alias, e.g. "limited", "medium"
    const spokenWords = W.trim().split(" ").filter((w) => w.length >= 4);
    if (spokenWords.length === 1) for (const o of s.opts) if (names(o).some((n) => n.trim().split(" ").includes(spokenWords[0]))) return o;
    return null;
  }

  /* ---------- Starting a demo from what the person says ---------- */
  function detect(raw) {
    const t = String(raw).toLowerCase();
    if (/understand|explain|what is|what's|how (do|does|to)|difference|meaning/.test(t)) return null;
    if (/\bbusiness profile\b/.test(t) && /(create|make|build|write|need|want|start|set ?up|help)/.test(t)) return "profile";
    if (/(want to start|thinking of starting|business idea|start a (food|tech|technology|hardware|clothing|farming|retail|online) business|i want (a|to start a) (food|tech|technology|hardware|clothing|farming|retail|online) (business|company)|have (k|kwacha|\$)\s*\d|capital of (k|kwacha)\s*\d)/.test(t)) return "profile";
    if (/\btpin\b/.test(t) && /(register|apply|get|start|set ?up|create|need|want|begin|help)/.test(t)) return "tpin";
    if (/\b(register|incorporate|apply for)\b.*\b(business|company)\b/.test(t) && !/profile|plan/.test(t)) return "business";
    return null;
  }

  /* ---------- Conversation engine ---------- */
  const ACKS = ["Got it", "Thanks", "Noted", "Great", "Perfect"];
  const stepsOf = (f) => FLOWS[f.key].steps;
  const cur = (f) => stepsOf(f)[f.i];
  const copy = (f) => JSON.parse(JSON.stringify(f));
  const HELP_CHIP = "What does that mean?";

  function qMsg(f, ack) {
    const s = cur(f), n = stepsOf(f).length;
    const chips = [...(s.opts || [])]; if (s.req === false) chips.push("Skip"); chips.push(HELP_CHIP);
    const m = {tag: `Question ${f.i + 1} of ${n}`, text: s.q + (s.hint ? "\n" + s.hint : ""), chips,
      speak: `Question ${f.i + 1}. ${s.q}${s.hint && !/“/.test(s.hint) ? " " + s.hint : ""}`};
    if (ack) { m.ack = ack.text; m.speak = ack.speak + " " + m.speak; }
    return m;
  }
  function reviewMsg(f, ack) {
    const steps = stepsOf(f);
    const list = steps.map((s) => [s.label, disp(s, f.a[s.k])]);
    const speak = ["Please check your answers.", ...steps.map((s) => `${s.label}: ${spoken(s, f.a[s.k])}.`), "Say create to finish, or tell me what to change."].join(" ");
    const m = {tag: "Review", text: "Here is what I have. Say “create” to finish, or tell me what to change, for example “change phone”.", list, chips: ["Create now", "Change something"], speak};
    if (ack) { m.ack = ack.text; m.speak = ack.speak + " " + m.speak; }
    return m;
  }
  function answersSoFar(f) {
    const steps = stepsOf(f).slice(0, f.i);
    if (!steps.length) return {text: "You have not answered anything yet."};
    return {text: "Your answers so far:", list: steps.map((s) => [s.label, disp(s, f.a[s.k])]), speak: "Your answers so far. " + steps.map((s) => `${s.label}: ${spoken(s, f.a[s.k])}.`).join(" ")};
  }
  function start(key) {
    const fl = FLOWS[key], f = {key, i: 0, a: {}, phase: "ask", edit: false};
    return {flow: f, messages: [
      {text: `${fl.opener} I will guide you through a few short stages and adapt the questions to your answers. You can type, tap an option or speak your answer. Ask me “what does that mean?” any time. This is a demo: nothing is sent to any government office.`, speak: `${fl.opener} I will guide you through a few short stages and adapt the questions to your answers. You can type, tap an option or speak. Ask me what does that mean, any time. This is a demo.`},
      qMsg(f)
    ]};
  }
  function advance(f, ack) {
    if (f.edit) { f.edit = false; f.phase = "confirm"; return {messages: [reviewMsg(f, ack)], flow: f}; }
    if (f.i < stepsOf(f).length - 1) { f.i++; return {messages: [qMsg(f, ack)], flow: f}; }
    f.phase = "confirm"; return {messages: [reviewMsg(f, ack)], flow: f};
  }
  function helpReply(f, raw, t, optStep) {
    const s = cur(f);
    const isQ = /\?\s*$/.test(raw.trim()) || EXPLAIN.test(t) || (optStep && Q_START.test(t));
    if (!isQ) return null;
    let text = null;
    for (const [re, ans] of FAQ) if (re.test(t)) { text = ans; break; }
    if (!text && /^(any |an |give me |show me )?examples?\b/.test(t) && (s.ph || s.opts)) text = s.opts ? `For example: ${s.opts[0]}.` : `For example: ${s.ph}.`;
    if (!text) {
      text = s.explain;
      if (s.ph && !s.opts) text += ` For example: ${s.ph}.`;
      if (/\bwhy\b/.test(t)) text = "The real form asks this so the agency can identify you and reach you. " + text;
    }
    return [{text, speak: text}];
  }
  function findStep(f, t) {
    const T = nz(t); let best = -1, len = 0;
    stepsOf(f).forEach((s, i) => {
      [s.label, s.k, ...(s.kw || [])].forEach((w) => { const n = nz(w); if (n && T.includes(n) && n.length > len) { best = i; len = n.length; } });
    });
    return best;
  }
  function result(f) {
    const fl = FLOWS[f.key], d = {};
    fl.steps.forEach((s) => { d[s.k] = disp(s, f.a[s.k]); });
    const r = fl.build(d); r.key = f.key;
    const others = START_CHIPS.filter((c) => detect(c) !== f.key);
    return {flow: null, messages: [{text: r.head + ". Here is your demo page.", card: r, speak: r.speak, chips: others}]};
  }

  function handle(flowIn, raw) {
    const f = copy(flowIn), fl = FLOWS[f.key], t = clean(raw);
    const out = (messages, flow) => ({messages, flow: flow === undefined ? f : flow});
    if (/^(cancel|stop|quit|exit|never ?mind|forget it|end)( this| the)?( demo)?$/.test(t))
      return out([{text: "No problem, I have stopped. Nothing was saved. Say “register a TPIN”, “register a business” or “create a business profile” whenever you are ready.", chips: START_CHIPS}], null);
    if (/^(start over|restart|start again|begin again)$/.test(t)) return start(f.key);
    const other = detect(raw);
    if (other && other !== f.key) { const r = start(other); r.messages.unshift({text: `Okay, switching to ${FLOWS[other].title.toLowerCase()}.`}); return r; }
    return f.phase === "confirm" ? confirmStep(f, raw, t, out) : askStep(f, raw, t, out);
  }

  function askStep(f, raw, t, out) {
    const s = cur(f);
    if (/^(back|go back|previous|previous question|undo)$/.test(t)) {
      if (f.i > 0) { f.i--; f.edit = false; return out([qMsg(f)]); }
      return out([{text: "This is the first question."}, qMsg(f)]);
    }
    if (/^(repeat|say again|again|read it again|read again|read the question|what was the question|say that again)$/.test(t)) return out([qMsg(f)]);
    if (/^read (all |my )?(answers|back|everything)$/.test(t)) return out([answersSoFar(f), qMsg(f)]);
    if (/^skip( this| it| question)?$/.test(t)) {
      if (s.req === false) { f.a[s.k] = ""; return advance(f, {text: "Skipped", speak: "Skipped."}); }
      return out([{text: "I cannot skip this one. It is needed."}, qMsg(f)]);
    }
    if (/^(next|continue|go on)$/.test(t)) return out([{text: "I need your answer first."}, qMsg(f)]);

    let v = null;
    if (f.key === "business" && s.k === "name") {
      const proposed = raw.trim().toLowerCase().replace(/\s+/g," ").replace(/[,.'’]/g,"");
      const cleanName = x => String(x).toLowerCase().replace(/\s+/g," ").replace(/[,.'’]/g,"").replace(/\b(limited|ltd|plc|incorporated|inc)\b/g,"").trim();
      const match = SAMPLE_TAKEN_NAMES.find(n => cleanName(n) === cleanName(proposed) || cleanName(proposed).includes(cleanName(n)) || cleanName(n).includes(cleanName(proposed)));
      if (match) return out([{text:`That name matches “${match}” in GOVAI's sample directory. Please try a more distinctive name. This is only a demo list, not a live PACRA name search.`,speak:"That name appears in the demo sample directory. Please try another name."}, qMsg(f)]);
    }
    if (s.opts) v = matchOpt(s, t);
    if (!v) {
      const help = helpReply(f, raw, t, !!s.opts);
      if (help) return out([...help, qMsg(f)]);
    }
    if (s.opts && !v) return out([{text: `Please choose one: ${s.opts.join(", ")}.`, chips: qMsg(f).chips}]);
    if (f.key === "business" && s.k === "confirm" && v === "I want to change something") { f.i = 0; return out([{text:"No problem. Let's start with the proposed name again."}, qMsg(f)]); }
    if (!s.opts) v = norm(s, raw);
    const err = check(s, v);
    if (err) return out([{text: err + (s.ph && !s.opts && !/like|Try/.test(err) ? ` For example: ${s.ph}.` : ""), chips: qMsg(f).chips}]);
    f.a[s.k] = v;
    const word = ACKS[(f.i + (f.edit ? 1 : 0)) % ACKS.length];
    const next = advance(f, {text: `${word}: ${disp(s, v)}`, speak: `${word}. ${spoken(s, v)}.`});
    if (f.key === "profile" && s.k === "industry") {
      const ideas = {"Food & hospitality":"Meal prep and lunch delivery, catering for small events, snack production, or a takeaway stall.",Technology:"Website and app development, IT support, AI workflow automation, or digital skills training.",Construction:"Paver installation, hardware supply, painting and maintenance, or small renovation services.","Retail & fashion":"Clothing resale, cosmetics, household essentials, phone accessories, or a niche online shop.",Agriculture:"Vegetable production, poultry, seedling nursery, or produce aggregation and delivery.","Transport & logistics":"Local courier services, delivery coordination, small-scale distribution, or vehicle hire."};
      if (ideas[v]) next.messages.unshift({text:`Some ideas in ${v.toLowerCase()} include: ${ideas[v]} These are starting points; we can adapt one to your budget, skills and town.`});
    }
    return next;
  }

  function confirmStep(f, raw, t, out) {
    if (/^(yes|yeah|yep|yup|ok|okay|sure|create|confirm|submit|finish|go ahead|correct|that'?s right|looks good|all good|done|proceed)\b/.test(t)) return result(f);
    if (/^(read|repeat|read back|read all)( my| the)?( answers| again| everything)?$/.test(t)) return out([reviewMsg(f)]);
    const idx = findStep(f, t);
    const questionLike = /\?\s*$/.test(raw.trim()) || EXPLAIN.test(t);
    if (idx >= 0 && !questionLike) {
      f.i = idx; f.edit = true; f.phase = "ask";
      return out([{text: `Okay, let's change ${stepsOf(f)[idx].label.toLowerCase()}.`, speak: `Okay, let's change ${stepsOf(f)[idx].label.toLowerCase()}.`}, qMsg(f)]);
    }
    if (/^(no|nope|change|edit|wrong|not right|something is wrong)\b/.test(t))
      return out([{text: "Which one would you like to change?", chips: stepsOf(f).map((s) => s.label)}]);
    if (questionLike) {
      let text = "I can explain any answer. Say “create” to finish, or tell me what to change.";
      for (const [re, ans] of FAQ) if (re.test(t)) { text = ans; break; }
      return out([{text, speak: text}, {text: "Say “create” to finish, or tell me what to change.", chips: ["Create now", "Change something"]}]);
    }
    return out([{text: "Say “create” to finish, or tell me what to change, for example “change phone”.", chips: ["Create now", "Change something"]}]);
  }

  /* ---------- Result card (shown inside the chat) ---------- */
  function cardHTML(c) {
    return `<article class="demo-card"><div class="demo-tag">DEMO</div><div class="demo-check" aria-hidden="true">✓</div><p class="demo-kicker">${esc(c.badge)}</p><h3>${esc(c.head)}</h3><div class="demo-main">${esc(c.main)}</div>${c.tagline ? `<p class="demo-tagline">${esc(c.tagline)}</p>` : ""}${c.id ? `<div class="demo-id"><span>${esc(c.id.label)}</span><strong>${esc(c.id.value)}</strong></div>` : ""}${c.summary ? `<p class="demo-summary">${esc(c.summary)}</p>` : ""}<dl class="demo-rows">${c.rows.filter((x) => x[1] && x[1] !== "—").map((x) => `<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join("")}</dl><p class="demo-fine">${esc(c.fine)}</p><div class="demo-actions"><button type="button" data-act="read">🔊 Read aloud</button><button type="button" data-act="print">🖨 Print</button>${c.key === "profile" ? '<button type="button" data-act="pdf">⬇ Download PDF</button>' : '<button type="button" data-act="print">Save as PDF</button>'}<button type="button" data-act="again" data-key="${esc(c.key)}">↺ Start again</button></div></article>`;
  }

  window.GOVAIFlows = {detect, start, handle, cardHTML, flows: FLOWS, START_CHIPS};
})();
