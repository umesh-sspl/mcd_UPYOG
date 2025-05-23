  import React, { useCallback, useMemo, useEffect,useRef,useState } from "react"
  import { useForm, Controller } from "react-hook-form";
  import { TextInput, SubmitBar, LinkLabel, ActionBar, CloseSvg, DatePicker, CardLabelError, SearchForm, SearchField, Dropdown, Table, Card, MobileNumber, Loader, CardText, Header } from "@nudmcdgnpm/digit-ui-react-components";
  import { Link,useHistory} from "react-router-dom";
  import CHBCancelBooking from "./CHBCancelBooking";

  /**
 * CHBSearchApplication Component
 * 
 * This component is responsible for rendering the search functionality for CHB (Community Hall Booking) applications.
 * It allows users to search for applications based on various parameters such as date range, status, and other filters.
 * 
 * Props:
 * - `tenantId`: The tenant ID for which the search is being performed.
 * - `isLoading`: Boolean indicating whether the data is being loaded.
 * - `t`: Translation function for internationalization.
 * - `onSubmit`: Callback function triggered when the search form is submitted.
 * - `data`: The search results data.
 * - `count`: The total count of search results.
 * - `setShowToast`: Function to manage the visibility and content of toast notifications.
 * 
 * State Variables:
 * - `bookingDetails`: State variable to store the details of a selected booking.
 * - `showModal`: State variable to manage the visibility of the modal for booking details.
 * 
 * Hooks:
 * - `useForm`: React Hook Form hook for managing form state and validation.
 * - `useEffect`: Used to register default form values and trigger the initial search on component mount.
 * - `Digit.Hooks.chb.useChbCreateAPI`: Custom hook to handle API calls for creating CHB applications.
 * - `Digit.Hooks.chb.useChbCommunityHalls`: Custom hook to fetch the list of community halls for the CHB module.
 * 
 * Logic:
 * - Initializes the search form with default values, including:
 *    - `offset`: Pagination offset (default is 0).
 *    - `limit`: Number of results per page (default is 10 for desktop).
 *    - `sortBy`: Field to sort the results by (default is "commencementDate").
 *    - `sortOrder`: Sort order (default is "DESC").
 *    - `fromDate`: Default start date for the search (one month ago).
 *    - `toDate`: Default end date for the search (today's date).
 *    - `status`: Default status filter (e.g., "Booked").
 * - Automatically registers form fields and triggers the initial search on component mount.
 * - Fetches the list of community halls using the `useChbCommunityHalls` hook.
 * 
 * Returns:
 * - A search form with fields for date range, status, and other filters.
 * - Displays search results in a table format with pagination and sorting options.
 * - Includes a modal for viewing or managing booking details.
 */
  const CHBSearchApplication = ({tenantId, isLoading, t, onSubmit, data, count, setShowToast }) => {
    
      const isMobile = window.Digit.Utils.browser.isMobile();
      const { register, control, handleSubmit, setValue, getValues, reset, formState } = useForm({
          defaultValues: {
              offset: 0,
              limit: !isMobile && 10,
              sortBy: "commencementDate",
              sortOrder: "DESC",
              fromDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // Default to one month ago
              toDate: new Date().toISOString().split('T')[0], // Default to today's date
              status: { i18nKey: "Booked", code: "BOOKED", value: t("CHB_BOOKED") }
          }
      })
      useEffect(() => {
        register("offset", 0)
        register("limit", 10)
        register("sortBy", "commencementDate")
        register("sortOrder", "DESC")
        handleSubmit(onSubmit)();
      },[register])
      const [bookingDetails,setBookingDetails]=useState("");
      const [showModal,setShowModal] = useState(false)
      const mutation = Digit.Hooks.chb.useChbCreateAPI(tenantId, false);
      // const { data: Menu } = Digit.Hooks.chb.useChbCommunityHalls(tenantId, "CHB", "CommunityHalls");

    const { data: Menu } = Digit.Hooks.useEnabledMDMS(tenantId, "CHB", [{ name: "CommunityHalls" }],
    {
      select: (data) => {
        const formattedData = data?.["CHB"]?.["CommunityHalls"]
        return formattedData;
      },
    });
    
    let menu = [];

      

    Menu &&
    Menu.map((one) => {
      menu.push({ i18nKey: `${one.code}`, code: `${one.code}`, value: `${one.name}` });
    });
      const GetCell = (value) => <span className="cell-text">{value}</span>;
      const handleCancelBooking=async()=>{
        setShowModal(false)
        const updatedApplication = {
          ...bookingDetails,
          bookingStatus: "CANCELLED"
        };
        await mutation.mutateAsync({
          hallsBookingApplication: updatedApplication
        });
        handleSubmit(onSubmit)();
      }
      const columns = useMemo( () => ([
          
          {
              Header: t("CHB_BOOKING_NO"),
              accessor: "bookingNo",
              disableSortBy: true,
              Cell: ({ row }) => {
                return (
                  <div>
                    <span className="link">
                      <Link to={`/digit-ui/employee/chb/applicationsearch/application-details/${row.original["bookingNo"]}`}>
                        {row.original["bookingNo"]}
                      </Link>
                    </span>
                  </div>
                );
              },
            },
          

            {
              Header: t("CHB_APPLICANT_NAME"),
              Cell: ( row ) => {
                return GetCell(`${row?.row?.original?.applicantDetail?.["applicantName"]}`)
                
              },
              disableSortBy: true,
            },
            {
              Header: t("CHB_COMMUNITY_HALL_NAME"),
              Cell: ({ row }) => {
                return GetCell(`${t(row.original["communityHallCode"])}`)
              },
              disableSortBy: true,
            
            },
            {
              Header: t("CHB_BOOKING_DATE"),
              Cell: ({ row }) => {
                return row?.original?.bookingSlotDetails.length > 1 
                ? GetCell(`${row?.original?.bookingSlotDetails[0]?.["bookingDate"]}` + " - " + `${row?.original?.bookingSlotDetails[row?.original?.bookingSlotDetails.length-1]?.["bookingDate"]}`) 
                : GetCell(`${row?.original?.bookingSlotDetails[0]?.["bookingDate"]}`);
              },
              disableSortBy: true,

            },
            {
              Header: t("PT_COMMON_TABLE_COL_STATUS_LABEL"),
              Cell: ({ row }) => {
                return GetCell(`${t(row?.original["bookingStatus"])}`)
              },
              disableSortBy: true,
            },
            
            {
              Header: t("CHB_ACTIONS"),
              Cell: ({ row }) => {
                const [isMenuOpen, setIsMenuOpen] = useState(false);
                const menuRef = useRef();
                const history = useHistory(); // Initialize history

                const toggleMenu = () => {
                  setIsMenuOpen(!isMenuOpen);
                };

                const closeMenu = (e) => {
                  if (menuRef.current && !menuRef.current.contains(e.target)) {
                    setIsMenuOpen(false);
                  }
                };

                React.useEffect(() => {
                  document.addEventListener("mousedown", closeMenu);
                  return () => {
                    document.removeEventListener("mousedown", closeMenu);
                  };
                }, []);

                let application = row?.original;
                
                const handleCancel = async () => {
                  setShowModal(true);
                  setBookingDetails(row?.original);
                };
                const { data: slotSearchData, refetch } = Digit.Hooks.chb.useChbSlotSearch({
                  tenantId: application?.tenantId,
                  filters: {
                    bookingId:application?.bookingId,
                    communityHallCode: application?.communityHallCode,
                    bookingStartDate: application?.bookingSlotDetails?.[0]?.bookingDate,
                    bookingEndDate: application?.bookingSlotDetails?.[application.bookingSlotDetails.length - 1]?.bookingDate,
                    hallCode: application?.bookingSlotDetails?.[0]?.hallCode,
                    isTimerRequired:true
                  },
                  enabled: false, // Disable automatic refetch
                });
                const handleMakePayment = async () => {
                  try {
                  const result = await refetch();
                  let SlotSearchData={
                    tenantId: application?.tenantId,
                    bookingId:application?.bookingId,
                    communityHallCode: application?.communityHallCode,
                    bookingStartDate: application?.bookingSlotDetails?.[0]?.bookingDate,
                    bookingEndDate: application?.bookingSlotDetails?.[application.bookingSlotDetails.length - 1]?.bookingDate,
                    hallCode: application?.bookingSlotDetails?.[0]?.hallCode,
                    isTimerRequired:true
              
                  }
                  const isSlotBooked = result?.data?.hallSlotAvailabiltityDetails?.some(
                    (slot) => slot.slotStaus === "BOOKED"
                  );
              
                  if (isSlotBooked) {
                    setShowToast({ error: true, label: t("CHB_COMMUNITY_HALL_ALREADY_BOOKED") });
                  } else {
                    history.push({
                      pathname: `/digit-ui/employee/payment/collect/${"chb-services"}/${application?.bookingNo}`,
                      state: { tenantId: application?.tenantId, bookingNo: application?.bookingNo,timerValue:result?.data.timerValue ,SlotSearchData:SlotSearchData },
                    });
                  }
                } catch (error) {
                  setShowToast({ error: true, label: t("CS_SOMETHING_WENT_WRONG") });
                  }
                };
                return (
                  <div ref={menuRef}>
                    <React.Fragment>
                      <SubmitBar
                        label={t("WF_TAKE_ACTION")}
                        onSubmit={toggleMenu}
                        disabled={
                          !["BOOKED", "BOOKING_CREATED", "PAYMENT_FAILED", "PENDING_FOR_PAYMENT"].includes(application?.bookingStatus)
                        } // Disable button if bookingStatus is not one of the allowed values
                      />
                      {isMenuOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '8px',
                            zIndex: 1000,
                          }}
                        >
                          {/* Action for Cancel */}
                          {application?.bookingStatus === "BOOKED" && (
                            <div
                              onClick={handleCancel}
                              style={{
                                display: 'block',
                                padding: '8px',
                                textDecoration: 'none',
                                color: 'black',
                                cursor: 'pointer',
                              }}
                            >
                              {t("CHB_CANCEL")}
                            </div>
                          )}
            
                          {/* Action for Collect Payment */}
                          {(application.bookingStatus === "BOOKING_CREATED" || application.bookingStatus === "PAYMENT_FAILED" || application.bookingStatus === "PENDING_FOR_PAYMENT") && (
                            <div
                              onClick={() => handleMakePayment()}
                              style={{
                                display: 'block',
                                padding: '8px',
                                textDecoration: 'none',
                                color: 'black',
                                cursor: 'pointer',
                              }}
                            >
                              {t("CHB_COLLECT_PAYMENT")}
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  </div>
                );
              },
            }
        ]), [] )
        const statusOptions = [
          { i18nKey: "Booked", code: "BOOKED", value: t("CHB_BOOKED") },
          { i18nKey: "Booking in Progress", code: "BOOKING_CREATED", value: t("CHB_BOOKING_IN_PROGRES") },
          { i18nKey: "Pending For Payment", code: "PENDING_FOR_PAYMENT", value: t("PENDING_FOR_PAYMENT") },
          { i18nKey: "Booking Expired", code: "EXPIRED", value: t("EXPIRED") },
          { i18nKey: "Cancelled", code: "CANCELLED", value: t("CANCELLED") }
        ];
      const onSort = useCallback((args) => {
          if (args.length === 0) return
          setValue("sortBy", args.id)
          setValue("sortOrder", args.desc ? "DESC" : "ASC")
      }, [])

      function onPageSizeChange(e){
          setValue("limit",Number(e.target.value))
          handleSubmit(onSubmit)()
      }

      function nextPage () {
          setValue("offset", getValues("offset") + getValues("limit"))
          handleSubmit(onSubmit)()
      }
      function previousPage () {
          setValue("offset", getValues("offset") - getValues("limit") )
          handleSubmit(onSubmit)()
      }
      let validation={}

      return <React.Fragment>
                  
                  <div>
                  <Header>{t("CHB_SEARCH_BOOKINGS")}</Header>
                  < Card className={"card-search-heading"}>
                      <span style={{color:"#505A5F"}}>{t("Provide at least one parameter to search for an application")}</span>
                  </Card>
                  <SearchForm onSubmit={onSubmit} handleSubmit={handleSubmit}>
                  <SearchField>
                      <label>{t("CHB_BOOKING_NO")}</label>
                      <TextInput name="bookingNo" inputRef={register({})} />
                  </SearchField>
                  <SearchField>
                      <label>{t("CHB_COMMUNITY_HALL_NAME")}</label>
                      <Controller
                              control={control}
                              name="communityHallCode"
                              render={(props) => (

                                  <Dropdown
                                  selected={props.value}
                                  select={props.onChange}
                                  onBlur={props.onBlur}
                                  option={menu}
                                  optionKey="i18nKey"
                                  t={t}
                                  disable={false}
                                  />
                                  
                              )}
                              />
                  </SearchField>
                  <SearchField>
                      <label>{t("PT_COMMON_TABLE_COL_STATUS_LABEL")}</label>
                      <Controller
                              control={control}
                              name="status"
                              render={(props) => (
                                  <Dropdown
                                  selected={props.value}
                                  select={props.onChange}
                                  onBlur={props.onBlur}
                                  option={statusOptions}
                                  optionKey="i18nKey"
                                  t={t}
                                  disable={false}
                                  />
                                  
                              )}
                              />
                  </SearchField>
                  <SearchField>
                  <label>{t("CHB_MOBILE_NUMBER")}</label>
                  <MobileNumber
                      name="mobileNumber"
                      inputRef={register({
                      minLength: {
                          value: 10,
                          message: t("CORE_COMMON_MOBILE_ERROR"),
                      },
                      maxLength: {
                          value: 10,
                          message: t("CORE_COMMON_MOBILE_ERROR"),
                      },
                      pattern: {
                      value: /[6789][0-9]{9}/,
                      //type: "tel",
                      message: t("CORE_COMMON_MOBILE_ERROR"),
                      },
                  })}
                  type="number"
                  componentInFront={<div className="employee-card-input employee-card-input--front">+91</div>}
                  //maxlength={10}
                  />
                  <CardLabelError>{formState?.errors?.["mobileNumber"]?.message}</CardLabelError>
                  </SearchField> 
                  <SearchField>
                      <label>{t("FROM_DATE")}</label>
                      <Controller
                          render={(props) => <DatePicker date={props.value} disabled={false} onChange={props.onChange}  max={new Date().toISOString().split('T')[0]}/>}
                          name="fromDate"
                          control={control}
                          />
                  </SearchField>
                  <SearchField>
                      <label>{t("TO_DATE")}</label>
                      <Controller
                          render={(props) => <DatePicker date={props.value} disabled={false} onChange={props.onChange} />}
                          name="toDate"
                          control={control}
                          />
                  </SearchField>
                  <SearchField></SearchField>
                  <SearchField className="submit">
                      <SubmitBar label={t("ES_COMMON_SEARCH")} submit />
                      <p style={{marginTop:"10px"}}
                      onClick={() => {
                          reset({ 
                              bookingNo: "", 
                              communityHallCode: "",
                              fromDate: "", 
                              toDate: "",
                              mobileNumber:"",
                              status: "",
                              offset: 0,
                              limit: 10,
                              sortBy: "commencementDate",
                              sortOrder: "DESC"
                          });
                          setShowToast(null);
                          previousPage();
                      }}>{t(`ES_COMMON_CLEAR_ALL`)}</p>
                  </SearchField>
              </SearchForm>
              {!isLoading && data?.display ? <Card style={{ marginTop: 20 }}>
                  {
                  t(data.display)
                      .split("\\n")
                      .map((text, index) => (
                      <p key={index} style={{ textAlign: "center" }}>
                          {text}
                      </p>
                      ))
                  }
              </Card>
              :(!isLoading && data !== ""? <Table
                  t={t}
                  data={data}
                  totalRecords={count}
                  columns={columns}
                  getCellProps={(cellInfo) => {
                  return {
                      style: {
                      minWidth: cellInfo.column.Header === t("CHB_INBOX_APPLICATION_NO") ? "240px" : "",
                      padding: "20px 18px",
                      fontSize: "16px"
                    },
                  };
                  }}
                  onPageSizeChange={onPageSizeChange}
                  currentPage={getValues("offset")/getValues("limit")}
                  onNextPage={nextPage}
                  onPrevPage={previousPage}
                  pageSizeLimit={getValues("limit")}
                  onSort={onSort}
                  disableSort={false}
                  sortParams={[{id: getValues("sortBy"), desc: getValues("sortOrder") === "DESC" ? true : false}]}
              />: data !== "" || isLoading && <Loader/>)}
              </div>
              {showModal && <CHBCancelBooking 
                t={t}
                //surveyTitle={surveyData.title}
                closeModal={() => setShowModal(false)}
                actionCancelLabel={"BACK"}
                actionCancelOnSubmit={() => setShowModal(false)}
                actionSaveLabel={"CHB_CANCEL"}
                actionSaveOnSubmit={handleCancelBooking}   
                onSubmit={handleCancelBooking} 
                >
            </CHBCancelBooking> }
          </React.Fragment>
  }

  export default CHBSearchApplication