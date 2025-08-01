
/**
   * Get patient details with comprehensive medical information
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPatient(req, res, next) {
    try {
      const { patientId } = req.params;

      // Use the normalized User model approach
      const user = await User.findOne({
        where: { 
          id: patientId,
          category: USER_CATEGORIES.PATIENT 
        },
        include: [
          {
            model: Patient,
            as: 'patient',
            required: true
          },
          {
            model: Doctor,
            as: 'primaryDoctor',
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'email']
              }
            ]
          }
        ]
      });

      if (!user) {
        throw new NotFoundError('Patient not found');
      }

      // Modern response formatting with the normalized data
      declare interface responseDataType {
	/**
   * Create a new patient with modern validation and service layer
   */
	createPatient(req: any, res: any, next: any): Promise<void>;

	/**
   * Get patients with advanced filtering and search
   */
	getPatients(req: any, res: any, next: any): Promise<any>;

	/**
   * Update patient with partial updates and validation
   */
	updatePatient(req: any, res: any, next: any): Promise<void>;

	buildSearchClause(search: any): Object | null;

	buildFilterClause(filter: any, userCategory: any, userId: any): any;
}
